import React, { useReducer } from 'react';
import JSZip from 'jszip';
import { waitWhile } from './components/AsyncHelper';


export enum RoutePath{
    root = "/",
    speech = "/speech",
    dialog = "/dialog"
  }

export enum langEnum {
    enUs = "en-US",
    ruRu = "ru=RU"
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
    none,
    SetDataSourceStart,
    SetDataSourceComplete

}

export interface IAppReducerstate{
    AppStatus:AppStatusEnum;
    CurrentRoutePath:string;
    SelectedZipFile:File|undefined;
    SelectedJsonFileName:string;
    MP3url:string;
}

export interface IActSetDataSourceStart{
    type:"ActSetDataSourceStart";
}

export interface IActSetDataSourceComplete{
    type:"ActSetDataSourceComplete";
    jsonFileBodyStr:string;
}

export type dispatchFunc = (action:AppAction)=>void;

export type AppAction = 
     IActSetDataSourceStart
    |IActSetDataSourceComplete;

export const appInitState:IAppReducerstate = {
    AppStatus:AppStatusEnum.none,
    CurrentRoutePath:RoutePath.root,
    SelectedZipFile:undefined,
    SelectedJsonFileName:"",
    MP3url:""
};

export function appReducer(state:IAppReducerstate,action:AppAction){
    let newState = {...state};
    switch(action.type){
        case 'ActSetDataSourceStart':
            //ActAsyncReadZipFile(action);
            newState.AppStatus = AppStatusEnum.SetDataSourceStart;
            return newState;
        case 'ActSetDataSourceComplete':
            let s=1;
            break; 
    }
    return state;
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

function getRoutePath(listItem:any):RoutePath{
    if(listItem.hasOwnProperty("p1")){
        return RoutePath.dialog;
    }
    return RoutePath.speech;
}


export async function ActAsyncReadZipFile(dispatch:dispatchFunc,zipFile:File){
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