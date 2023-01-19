import React, { FunctionComponent, useRef, useEffect,useState } from 'react';
//@ts-ignore
import { SayButton } from 'react-say';
import { langEnum } from '../AppData';
import { waitWhile } from './AsyncHelper';

export interface ISayItem{
    lang?:langEnum;
    sayText:string;
}

export interface ISayButtonWrapperProps{
    onBeforeSay?:(itemIndex:number)=>boolean;
    sayItemQueue:ISayItem[];
}

export const SayButtonWrapper: FunctionComponent<ISayButtonWrapperProps> = (props) => {
    const [currItemIndex,setCurrItemIndex] = useState(0);
    //const [isPlaying,setIsPlaying] = useState(false);
    let currItem = props.sayItemQueue[currItemIndex];
    if(!currItem.lang){
        currItem.lang = langEnum.enUs;
    }
    let langSelector = (voices: any) => {
        let enVoice = "Microsoft Mark - English (United States)";
        let ruVoice = "Google русский";
        let voiceName = (currItem.lang == langEnum.enUs ? enVoice : ruVoice);
        return voices.find((voice: any) => voice.name === voiceName);
    }
    const sayWrapRef = useRef<HTMLDivElement>(null);
    const simulateButtonClick = ()=>{
        if(props.onBeforeSay ){
            if(!props.onBeforeSay(currItemIndex)){
                return;
            }
        }
        if(sayWrapRef.current){
            sayWrapRef.current.getElementsByTagName("button")[0].click();
        }
    };
    useEffect(()=>{simulateButtonClick();},[currItemIndex]);
    return(
        <div ref={sayWrapRef} id="SayButtonWrapper" style={{ display: "none" }}>
            <SayButton 
                voice={langSelector}
                text={currItem.sayText}
                onEnd={() => { 
                    if(currItemIndex+1<props.sayItemQueue.length){
                        setCurrItemIndex(currItemIndex+1);
                    }
                    console.log("say completed");
                }}
            />        
        </div>
    ); 
}