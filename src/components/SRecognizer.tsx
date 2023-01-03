import React,{useState}  from 'react';
import { createSpeechlySpeechRecognition } from '@speechly/speech-recognition-polyfill';
//@ts-ignore
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {SPlayer} from './SPlayer';

const appId = '<INSERT_SPEECHLY_APP_ID_HERE>';
const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);
//SpeechRecognition.applyPolyfill(SpeechlySpeechRecognition);


export enum SRCommand{
    Start="Start",
    Stop="Stop",
    Reset="Reset"
}

export interface ISRecognizerProps{
    parent:SPlayer,  
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
      return <span>Browser doesn't support speech recognition.</span>;
    }
    let command = props.parent.state.SRecognizerCommand;
    if(!command){
        return (<div></div>);
    }

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
  
    return (
      <div>
        <p>Microphone: {listening ? 'on' : 'off'}</p>
        <div className='splayer_page__text'>{transcript}</div>
      </div>
    );
  };
  export default SRecognizer;