import React from 'react';
import { ISayItem, langEnum } from '../AppData';

class SayTextClass{
    // 'Microsoft Pavel - Russian (Russia)' - pc
    // 'Microsoft Irina - Russian (Russia)' - pc
    // 'Google русский' - pc
    // 'Russian Russia' = mobile
    enVoices:SpeechSynthesisVoice[]=[];
    ruVoices:SpeechSynthesisVoice[]=[];
    selectedEnVoice: SpeechSynthesisVoice|undefined = undefined;
    selectedRuVoice: SpeechSynthesisVoice|undefined = undefined;
    constructor(){
        this.init();
    }
    
    init(){
        this.getAllVoices()
        .then((allVoices:any)=>{
            this.enVoices = allVoices.filter((v:SpeechSynthesisVoice)=>v.lang === 'en-US' || v.lang === 'en_US');
            this.ruVoices = allVoices.filter((v:SpeechSynthesisVoice)=>v.lang === 'ru-RU' || v.lang === 'ru_RU');
            this.selectedEnVoice = this.enVoices[0];
            this.selectedRuVoice = this.ruVoices[0]; 
        });
    }

    
    getAllVoices() {
        return new Promise(
            (resolve, reject) => {
                let synth = window.speechSynthesis;
                let id = setInterval(() => {
                    if (synth.getVoices().length !== 0) {
                        resolve(synth.getVoices());
                        clearInterval(id);
                    }
                }, 10);
            }
        )
    }


    addMessages(mrange:ISayItem[]){
        mrange.forEach(m=>this.addMessage(m));
    }

    addMessage(msg:ISayItem,completeHandler?:(evt:any)=>void){
        let speachMsg = new SpeechSynthesisUtterance();
        speachMsg.text = msg.sayText;
        if(msg.lang === langEnum.enUs){
            if(this.selectedEnVoice){
                speachMsg.voice = this.selectedEnVoice; 
                speachMsg.lang = this.selectedEnVoice.lang;    
            }
        } else {
            if(this.selectedRuVoice){
                speachMsg.voice = this.selectedRuVoice;
                speachMsg.lang = this.selectedRuVoice.lang;    
            }
        }        
        if(completeHandler){
            const hndlr = (evt:any)=>{
                speachMsg.removeEventListener("end",hndlr);
                completeHandler(evt);
            };
            speachMsg.addEventListener("end",hndlr);            
        }
        if(speachMsg.voice){
            window.speechSynthesis.speak(speachMsg);
        }
    }

    cancelAllMessages(){
        window.speechSynthesis.cancel();
        
    }

    speaking():boolean{
        return window.speechSynthesis.speaking;
    }
}

export const SayText = new SayTextClass();