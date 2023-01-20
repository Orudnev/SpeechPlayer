import React, { useReducer } from 'react';
import JSZip from 'jszip';
import { waitWhile } from './components/AsyncHelper';
import { AppGlobal } from './App';
import {SRCommand} from './components/SRecognizer';
import { VoiceCommand } from './components/CompareResult';

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
    voiceCommand:VoiceCommand;

}

export const appInitState:IAppReducerstate = {
    AppStatus:AppStatusEnum.none,
    CurrentRoutePath:RoutePath.root,
    SelectedZipFile:undefined,
    SelectedJsonFileName:"",
    MP3url:"",
    SRecognizeCmd:SRCommand.Stop,
    itemsRaw:[],
    selItemIndex:-1,
    voiceCommand:VoiceCommand.NoCommand
};

export function appReducer(state:IAppReducerstate,action:AppAction){
    let newState = {...state};
    switch(action.type){
        case 'ActSetDataSourceStart':
            //ActAsyncReadZipFile(action);
            newState.AppStatus = AppStatusEnum.SetDataSourceStart;
            return newState;
        case 'ActSetDataSourceComplete':
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
        case 'ActSelectItem':
            newState.selItemIndex = action.newIndex;
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

class AppDataHelperClass{
    getSelectedDlgItem():IDialogItem|undefined{
        if(AppGlobal.state.selItemIndex == -1){
            return undefined;
        }
        return  AppGlobal.state.itemsRaw[AppGlobal.state.selItemIndex] as IDialogItem;
    }
    getNextDlgItemIndex():number{
        return AppGlobal.state.selItemIndex+1;
    }
    isDlgStarted():boolean{
        let st = AppGlobal.state;
        let result = (st.AppStatus.includes("Dlg") && st.AppStatus != AppStatusEnum.DlgPaused);
        return result;
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
                dispatch({type:'ActSetDataSourceComplete',jsonFileBodyStr:jsonStr});
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