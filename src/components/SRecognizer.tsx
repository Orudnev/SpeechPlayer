import React,{useState}  from 'react';
import { createSpeechlySpeechRecognition } from '@speechly/speech-recognition-polyfill';
//@ts-ignore
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {SPlayer} from './SPlayer';

const appId = '<INSERT_SPEECHLY_APP_ID_HERE>';
const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);
//SpeechRecognition.applyPolyfill(SpeechlySpeechRecognition);


export enum SRCommand{
    None="None",
    Start="Start",
    Stop="Stop",
    Reset="Reset"
}

export interface ISRecognizerProps{
    command:SRCommand;
    onChange:(text:string)=>void;
}

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

    if(command == SRCommand.Start){
        if(!listening){
            if (transcript){
                resetTranscript();
            }
            setTimeout(()=>{
                SpeechRecognition.startListening({continuous: true,language: 'en-US'});    
            },0)
        }
    }
    if(command == SRCommand.Stop){
        if(listening){
            SpeechRecognition.stopListening();
        }
    }

    if(command == SRCommand.Reset){
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
    return (
      <button className={"toolbar-button"}>
        <div className={imgClassStr} />
      </button>
    );
  };


  export default SRecognizer;


