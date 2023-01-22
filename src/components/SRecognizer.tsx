import React,{useState}  from 'react';
import { createSpeechlySpeechRecognition } from '@speechly/speech-recognition-polyfill';
//@ts-ignore
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { wait } from './AsyncHelper';

const appId = '<INSERT_SPEECHLY_APP_ID_HERE>';
const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);
//SpeechRecognition.applyPolyfill(SpeechlySpeechRecognition);


export enum SRCommand{
    None="None",
    StartListen="StartListen",
    StopListen="StopListen",
    ResetResult="ResetResult"
}

export interface ISRecognizerProps{
    command:SRCommand;
    onChange:(text:string)=>void;
}

class stubTalker{
    words=["without","parsing","script","fetched","attributes","blocks","go go","byrbyrbyr","next"];
    currIndex = 0;
    handler = (w:string)=>{};
    constructor(handlerFunc:any){
        this.handler = handlerFunc;
    }
    
    async start(){
        setTimeout(()=>{
            let wrd=this.words[this.currIndex];
            this.handler(wrd); 
            if(this.currIndex<this.words.length-1){
                this.currIndex++;
            } else {
                this.currIndex = 0;
            }
            this.start();
        },1000);
    }
} 

var stubTalkerInstance:any = null;

var lastRecognizedText = "";
const SRecognizer = (props:ISRecognizerProps) => {
    const {
      transcript,
      listening,
      resetTranscript,
      browserSupportsSpeechRecognition
    } = useSpeechRecognition();    


    if (!browserSupportsSpeechRecognition) {
      alert("Browser doesn't support speech recognition.");
      return (<div />);
    }
    let command = props.command;

    if(command == SRCommand.StartListen){
        if(!listening){
            if (transcript){
                resetTranscript();
            }
            setTimeout(()=>{
                SpeechRecognition.startListening({continuous: true,language: 'en-US'});    
            },0)
        }
        if(!stubTalkerInstance){
            //stubTalkerInstance = new stubTalker(props.onChange);
            //stubTalkerInstance.start();
        }    
    }

    if(command == SRCommand.StopListen){
        if(listening){
            SpeechRecognition.stopListening();
        }
    }

    if(command == SRCommand.ResetResult){
        if (transcript){
            resetTranscript();
        }
    }

    if(props.onChange && transcript){
        if(lastRecognizedText != transcript){
            props.onChange(transcript);
            lastRecognizedText = transcript;    
        }
    }
    let imgClassStr = (listening ? 'img-microphoneOn' : 'img-microphoneOff')
    return(<div />); 
    return (
      <button className={"toolbar-button"}>
        <div className={imgClassStr} />
      </button>
    );
  };


  export default SRecognizer;


