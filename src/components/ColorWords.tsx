import React, { FunctionComponent, ReactHTMLElement} from "react"; 
import { idText, isPropertySignature } from "typescript";
import {SRResultWord} from "./SRResultAnalyzer";
import {ConfigSettings} from "../AppData";
import { AppGlobal } from "../App";

export interface IColorWordsProps{
    selectedSentenceIndex:number;
    text:string;
    recResult?:SRResultWord[];
}

export const NumUpDown:FunctionComponent<IColorWordsProps> = (props)=>{
    return (
        <div className="num-updown">
            <button className={"num-updown_btn"} 
                onClick={()=>{ 
                    AppGlobal.dispatch({type:"ActSetSelectedSentenceIndex",index:AppGlobal.state.selectedSentenceIndex-1});
            }} >
                <div className={"img-left"} />
            </button> 
            <div className={"num-updown_value"}>{props.selectedSentenceIndex}</div>
            <button className={"num-updown_btn"} 
                onClick={()=>{ 
                    AppGlobal.dispatch({type:"ActSetSelectedSentenceIndex",index:AppGlobal.state.selectedSentenceIndex+1});
            }} >
                <div className={"img-right"} />
            </button>        
        </div>
    );
}


export const ColorWords:FunctionComponent<IColorWordsProps> = (props)=>{

    const allWords = props.text.split(" "); 
    const resultWords = (props.recResult && props.recResult.length>0 ? 
            JSON.parse(JSON.stringify(props.recResult)) as SRResultWord[]
            : [] );
    const  wordsJsx:JSX.Element[] = [];    
    
    let currSentIndex = 1;
    allWords.forEach((w,index)=>{
        let classStr = "";
        if(props.selectedSentenceIndex!=undefined && props.selectedSentenceIndex>0 && props.selectedSentenceIndex === currSentIndex ){
            classStr = "select-sentence-word";
        }
        let wordResult = resultWords.find(wr=>w.toLowerCase().includes(wr.text.toLowerCase()) && wr.resultCount>0);
        if(wordResult){
            classStr += " hl-word";
        } else {
            if(ConfigSettings.dlgAnswerTextHidden()){
                classStr += " hidden-word"; 
            } else {
                classStr += " reg-word"; 
            }
        }
        wordsJsx.push(<span key={"wrd"+index} className={classStr}>{w} </span>);
        if(wordResult){
            wordResult.resultCount--;
        }
        if(w.includes(".")){
            currSentIndex++;
        }
    }); 
 
    const btnSayAnswerImgClassStr = (ConfigSettings.config.dlgSayAnswer?"img-sound":"img-no-sound");
    const btnVisibleImgClassStr = (ConfigSettings.config.dlgAnswerTextHidden?"img-invisible":"img-visible");
    const btnRepeatImgClassStr = (ConfigSettings.config.dlgRepeat?"img-refresh":"img-refresh-on");
    return (
        <div >
            <div className="splayer-page__toolbar">
                <button className={"toolbar-button"} 
                    onClick={()=>ConfigSettings.dlgSayAnswer(!ConfigSettings.dlgSayAnswer())} >
                    <div className={btnSayAnswerImgClassStr} />
                </button>
                <button className={"toolbar-button"} 
                    onClick={()=>ConfigSettings.dlgAnswerTextHidden(!ConfigSettings.dlgAnswerTextHidden())} >
                    <div className={btnVisibleImgClassStr} />
                </button>
                <button className={"toolbar-button"} 
                    onClick={()=>{
                        let cs = ConfigSettings.config;
                        ConfigSettings.dlgRepeat(!ConfigSettings.dlgRepeat())}} >
                    <div className={btnRepeatImgClassStr} />
                </button>
                <NumUpDown {...props}/>
            </div>
            {wordsJsx}
        </div>
    );
}