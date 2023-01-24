import React, { FunctionComponent, ReactHTMLElement} from "react"; 
import { idText } from "typescript";
import {SRResultWord} from "./SRResultAnalyzer";
import {ConfigSettings} from "../AppData";

export interface IColorWordsProps{
    selectedSentenceIndex?:number;
    text:string;
    recResult?:SRResultWord[];
}


export const ColorWords:FunctionComponent<IColorWordsProps> = (props)=>{

    const allWords = props.text.split(" "); 
    const resultWords = (props.recResult && props.recResult.length>0 ? 
            JSON.parse(JSON.stringify(props.recResult)) as SRResultWord[]
            : [] );
    const  wordsJsx:JSX.Element[] = [];    
    let currSentIndex = 0;
    allWords.forEach((w,index)=>{
        let classStr = "";
        if(props.selectedSentenceIndex!=undefined && props.selectedSentenceIndex === currSentIndex){
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
 
    const btnHideAnswerTextStr = "toolbar-button" + (ConfigSettings.config.dlgAnswerTextHidden?" toolbar-button__enabled":" toolbar-button__disabled")
    return (
        <div >
            <div className="splayer-page__toolbar">
                <button className={btnHideAnswerTextStr} 
                    onClick={()=>ConfigSettings.dlgAnswerTextHidden(!ConfigSettings.dlgAnswerTextHidden())} >
                    <div className={"img-invisible"} />
                </button>
            </div>
            {wordsJsx}
        </div>
    );
}