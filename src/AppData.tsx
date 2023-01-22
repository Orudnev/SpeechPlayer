import React, { useReducer } from 'react';
import JSZip from 'jszip';
import { waitWhile } from './components/AsyncHelper';
import { AppGlobal } from './App';
import {SRCommand} from './components/SRecognizer';
import { VoiceCommand } from './components/SRResultAnalyzer';



interface IResultItem{
    itemIndex:number;
    repeatCount:number;
    lastTime:Number;
}


interface IResultRecord{
    arc:string;
    json:string;
    itemCount:number;
    items:IResultItem[];
}

export enum RoutePath{
    root = "/",
    speech = "/speech",
    dialog = "/dialog"
  }

export enum langEnum {
    enUs = "en-US",
    ruRu = "ru=RU"
}

export interface ISpeechItem {
    en: string;
    ru?: string;
    startTime?: number;
    endTime?: number;
}

export interface IDialogItem {
    p1: ISpeechItem;
    p2: ISpeechItem;
}

enum AsyncOperationType{
    playMp3="playMp3",
    sayText="sayText",
    voiceRecognition="voiceRecognition"
}

interface IPlayMp3Data{
    startTim: number;
    endTim: number;
}

interface ISayTextData{
    lng: langEnum; 
    textToSay: string;
}

export enum AppStatusEnum{
    none="none",
    SetDataSourceStart="SetDataSourceStart",
    SetDataSourceComplete="SetDataSourceComplete",
    DlgPaused="DlgPaused",
    DlgShowItemAndSayQuestion="DlgShowItemAndSayQuestion",
    DlgSayAnswer="DlgSayAnswer",
}



export interface IActSetDataSourceStart{
    type:"ActSetDataSourceStart";
}

export interface IActSetDataSourceComplete{
    type:"ActSetDataSourceComplete";
    zipFile:File;
    jsonFileBodyStr:string;
}

export interface IActSetAppStatus{
    type:"ActSetAppStatus";
    newStatus:AppStatusEnum;
}

export interface IActSelectItem{
    type:"ActSelectItem";
    newIndex:number;
}

export interface IActSetLastRecognizedText{
    type:"ActSetLastRecognizedText";
    text:string;
}


export interface IActExecSRCommand{
    type:"ActExecSRCommand";
    command:SRCommand;
}

export interface IActExecVoiceCommand{
    type:"ActExecVoiceCommand";
    command:VoiceCommand;
}




export type DispatchFunc = (action:AppAction)=>void;

export type AppAction = 
        IActSetDataSourceStart
    |   IActSetDataSourceComplete
    |   IActSetAppStatus
    |   IActSelectItem
    |   IActSetLastRecognizedText
    |   IActExecSRCommand
    |   IActExecVoiceCommand;

export interface IAppReducerstate{
    AppStatus:AppStatusEnum;
    CurrentRoutePath:string;
    SelectedZipFile:File|undefined;
    SelectedJsonFileName:string;
    MP3url:string;
    SRecognizeCmd:SRCommand;
    itemsRaw:any[];
    selItemIndex:number;
    lastRecognizedText:string;
    voiceCommand:VoiceCommand;
}

export const appInitState:IAppReducerstate = {
    AppStatus:AppStatusEnum.none,
    CurrentRoutePath:RoutePath.root,
    SelectedZipFile:undefined,
    SelectedJsonFileName:"",
    MP3url:"",
    SRecognizeCmd:SRCommand.StopListen,
    itemsRaw:[],
    selItemIndex:-1,
    lastRecognizedText:"",
    voiceCommand:VoiceCommand.NoCommand
};

export function appReducer(state:IAppReducerstate,action:AppAction){
    console.log(action.type);
    let newState = {...state};
    switch(action.type){
        case 'ActSetDataSourceStart':
            newState.AppStatus = AppStatusEnum.SetDataSourceStart;
            return newState;
        case 'ActSetDataSourceComplete':
            newState.SelectedZipFile = action.zipFile;
            newState.CurrentRoutePath = RoutePath.speech;
            newState.AppStatus = AppStatusEnum.DlgPaused;        
            processJsonFile(action.jsonFileBodyStr,newState);
            setTimeout(() => {
                AppGlobal.navigate(newState.CurrentRoutePath);    
            }, 0);
            return newState;
        case 'ActSetAppStatus':
            newState.AppStatus = action.newStatus;
            return newState;
        case 'ActSetLastRecognizedText':
            newState.lastRecognizedText = action.text;
            return newState;
        case 'ActSelectItem':
            newState.selItemIndex = action.newIndex;
            newState.lastRecognizedText = "";
            return newState;
        case 'ActExecSRCommand':
            newState.SRecognizeCmd = action.command;
            return newState;
        case 'ActExecVoiceCommand':
            newState.voiceCommand = action.command;
            return newState;
    }
    return state;
}


enum LstorageKey {
    config = "config",
    results = "results"
}

interface IDlgItemWithResult{
    item:IDialogItem;
    result?:IResultItem;
    originalIndex:number;
}

class AppDataHelperClass{
    getDlgItems():IDialogItem[]{
        return AppGlobal.state.itemsRaw as IDialogItem[];
    }
    getSelectedDlgItem():IDialogItem|undefined{
        if(AppGlobal.state.selItemIndex == -1){
            return undefined;
        }
        return  AppGlobal.state.itemsRaw[AppGlobal.state.selItemIndex] as IDialogItem;
    }
    getNextDlgItemIndex():number{
        this.saveDlgItemResult();
        let nextItem = this.getOldestDlgItem();
        
        return nextItem.originalIndex;
    }    
    isDlgStarted():boolean{
        let st = AppGlobal.state;
        let result = (st.AppStatus.includes("Dlg") && st.AppStatus != AppStatusEnum.DlgPaused);
        return result;
    }
    getOldestDlgItem(){
        //find item that whose repeat count is less or access time is oldest
        let items = this.getDlgItemsWithResult();
        let minItem = items.reduce((accumItm,currItm)=>{
            if(!accumItm.result && !currItm.result) return accumItm;
            if(!accumItm.result && currItm.result) return accumItm;
            if(accumItm.result && !currItm.result) return currItm;
            if(accumItm.result && currItm.result){
                if(currItm.result.repeatCount<accumItm.result.repeatCount) return currItm;
                if(currItm.result.repeatCount == accumItm.result.repeatCount){
                    return (currItm.result.lastTime<accumItm.result.lastTime?currItm:accumItm);
                }
                if(currItm.result.repeatCount<accumItm.result.repeatCount) return accumItm;
            } 
            return accumItm
        });
        return minItem;
    }
    getDlgItemsWithResult(){
        let resultsJsonStr = localStorage.getItem(LstorageKey.results); 
        let result:IResultRecord[] = []; 
        if (resultsJsonStr) {
            result = JSON.parse(resultsJsonStr) as IResultRecord[];
        }   
        let selFileResult = result.find(itm=>itm.json == AppGlobal.state.SelectedJsonFileName);
        let itemsWithResult:IDlgItemWithResult[] = this.getDlgItems().map((itm,index)=>{
            let itmdlg = itm as IDialogItem;
            let resultItm:IResultItem|undefined = undefined;
            if(selFileResult){
                resultItm = selFileResult.items.find(itm=>itm.itemIndex == index);
            } 
            let newDlgItmWithResult:IDlgItemWithResult = {item:itmdlg,result:resultItm,originalIndex:index};
            return newDlgItmWithResult;
        });
        return itemsWithResult;
    }
    saveDlgItemResult(increaseRepeatCount=false){
        let inc = (increaseRepeatCount?1:0);
        let resultsJsonStr = localStorage.getItem(LstorageKey.results); 
        let result:IResultRecord[] = []; 
        if (resultsJsonStr) {
            result = JSON.parse(resultsJsonStr) as IResultRecord[];
        }
        let st = AppGlobal.state;
        let zipFileName = AppGlobal.state.SelectedZipFile!.name;
        let jsonFileName = AppGlobal.state.SelectedJsonFileName;
        let selItemIndex = AppGlobal.state.selItemIndex;
        let newResult = result.filter(rec=>rec.arc !=zipFileName  && rec.json != jsonFileName);
        let oldRec = result.find(rec=>rec.arc == zipFileName && rec.json == jsonFileName);
        let newItems:IResultItem[] = [];
        let oldRepeatCount = 0;
        if(oldRec){
            newItems = oldRec.items.filter(itm=>itm.itemIndex != selItemIndex);
            let oldItem = oldRec.items.find(itm=>itm.itemIndex == selItemIndex);
            if(oldItem){
                oldRepeatCount = oldItem.repeatCount;
            }
        } 
        let newItem:IResultItem = {itemIndex:selItemIndex,repeatCount:oldRepeatCount+inc,lastTime:new Date().getTime()};
        newItems.push(newItem);
        let newRec:IResultRecord = {arc:zipFileName,json:jsonFileName,itemCount:AppGlobal.state.itemsRaw.length,items:newItems};
        newResult.push(newRec);
        let jsonStrToSave = JSON.stringify(newResult);
        localStorage.setItem(LstorageKey.results, jsonStrToSave);        
    }
}

class ConvertBinToStrClass{
    binToStrConvInstance = new FileReader();
    result:string = "";
    constructor(){
        this.onBinToStringConverted = this.onBinToStringConverted.bind(this);
        this.binToStrConvInstance.addEventListener("loadend", this.onBinToStringConverted);
    }

    async readAsText(data:any){
        this.binToStrConvInstance.readAsText(data);
        this.result = "";
        await waitWhile(()=>this.result=="");
        return this.result;
    }
  
    onBinToStringConverted(e: any) {
        this.result = e.srcElement.result;
    }   
}

const ConvertBinToStr = new ConvertBinToStrClass();

function processJsonFile(jsonFileContentStr:string,newState:IAppReducerstate){
    let incomingJson = JSON.parse(jsonFileContentStr);
    newState.itemsRaw = incomingJson.items;
    let listItem = newState.itemsRaw[0];
    if(listItem.hasOwnProperty("p1")){
        newState.CurrentRoutePath = RoutePath.dialog;
    }
}

export const appDataHelper = new AppDataHelperClass();

export async function ActAsyncReadZipFile(dispatch:DispatchFunc,zipFile:File){
    dispatch({type:'ActSetDataSourceStart'});
    JSZip.loadAsync(zipFile as Blob)
    .then((zip) => {
        let fileNames = [];
        for (let prop in zip.files) {
            fileNames.push(prop);
        }
        let jsonFileName = fileNames.find(itm => itm.includes(".json"));
        let mp3FileName = fileNames.find(itm => itm.includes(".mp3"));
        if (jsonFileName) {
            zip.files[jsonFileName].async('blob').then(async (res: any) => {
                let jsonStr = await ConvertBinToStr.readAsText(res);
                dispatch({type:'ActSetDataSourceComplete',jsonFileBodyStr:jsonStr,zipFile:zipFile});
                // let incomingJson = JSON.parse(jsonStr);
                // let newPath = getRoutePath(incomingJson.items[0]);
                // newState.CurrentRoutePath = newPath;
            });
        } 
        // if (mp3FileName) {
        //     zip.files[mp3FileName].async('blob').then((res: any) => {
        //         newState.MP3url = URL.createObjectURL(res as Blob);
        //     });
        // }
    })    
}