import { idText } from "typescript";
import { AppGlobal } from "../App";
import reportWebVitals from "../reportWebVitals";
import { SRCommand } from "./SRecognizer";


function devideWordsContainingHyphen(inStr: string) {
    let result = inStr.replace(/-/g, " ");
    return result;
}

function filterUnnecessarySymbols(inStr: string) {
    let result = inStr.replace(/[\.,!?;]/g, "");
    result = devideWordsContainingHyphen(result);
    return result;
}

function normilizeSymbols(inStr: string){
    let result = inStr.replace(/ё/g, "е");
    return result;
}

export enum VoiceCommand {
    NoCommand = "NoCommand",
    ListenCommand="ListenCommand",
    MarkItemAsPassed = "MarkItemAsPassed",
    GoNextItem = "GoNextItem",
    ClearListenResultAndListenAgain = "ClearListenResultAndListenAgain",
    GoNextItemSet = "GoNextItemSet"
}

export interface SRResultWord {
    text: string;
    etalonCount: number;
    resultCount: number;
}

interface IVoiceCommandItem {
    key: VoiceCommand,
    words: string[]
}

const voiceCommandWords: IVoiceCommandItem[] = [
    { key: VoiceCommand.MarkItemAsPassed, words: ["yeah", "yes","я"] },
    { key: VoiceCommand.GoNextItem, words: ["next"] },
    { key: VoiceCommand.ClearListenResultAndListenAgain, words: ["again"] },
    { key: VoiceCommand.GoNextItemSet, words: ["app"] },
    { key: VoiceCommand.ClearListenResultAndListenAgain, words: ["down"] },
];


class SRResultTextAnalyzerClass {
    etalonText = "";
    etalonWords: SRResultWord[] = [];
    isCommandMode = false;
    startCommandWords = ["google", "coco", "go go", "oh"];
    diffText = "";
    SetEtalonText(text: string) {
        this.etalonText = normilizeSymbols(text);
        this.etalonWords = [];
        let words = filterUnnecessarySymbols(text).split(" ");
        words.forEach(wrd => {
            let rItem = this.etalonWords.find(rw => rw.text == wrd.toLowerCase());
            if (rItem) {
                rItem.etalonCount++;
            } else {
                let newItem: SRResultWord = {
                    text: wrd.toLowerCase(),
                    etalonCount: 1,
                    resultCount: 0
                }
                this.etalonWords.push(newItem);
            }
        });
        console.log("etalonWords",this.etalonWords);
    }

    AddNewText(recognizedText: string) {
        recognizedText = filterUnnecessarySymbols(recognizedText);
        recognizedText = normilizeSymbols(recognizedText);
        this.diffText = ""
        let equals = false;
        let prevRecognizedText = AppGlobal.state.lastRecognizedText;
        let lastWord = "";
        for (let pos = 0; pos < recognizedText.length; pos++) {
            let currChar = recognizedText.charAt(pos);
            if(currChar==" "){
                lastWord = "";
            }
            if (pos < prevRecognizedText.length) {
                let prevChar = prevRecognizedText.charAt(pos);
                if (prevChar.toLowerCase() == currChar.toLowerCase()) {
                    equals = true;
                    lastWord += currChar;
                    continue;
                }
            }
            if(this.diffText==""){
                this.diffText = lastWord;
            }
            this.diffText += currChar; 
        }

        if (!this.diffText) {
            this.diffText = recognizedText;
        } 
        //console.log("prevRecText",prevRecognizedText);
        console.log("prevText:",prevRecognizedText);
        console.log("recText:",recognizedText);
        console.log("diffText:",this.diffText);
        if (this.isCommandMode) {
            this.processCommand(this.diffText);
            return;
        } else {
            if (this.findStartCommandWord(this.diffText)) {
                this.isCommandMode = true;
                AppGlobal.dispatch({type:"ActExecVoiceCommand",command:VoiceCommand.ListenCommand});
                setTimeout(()=>{
                    if(this.isCommandMode){
                        AppGlobal.dispatch({type:"ActExecVoiceCommand",command:VoiceCommand.NoCommand});
                        AppGlobal.dispatch({type:"ActExecSRCommand",command:SRCommand.ResetResult});
                        this.isCommandMode = false;
                    }
                },3000);    
                return;
            }
        }
        this.etalonWords.forEach(itm=>itm.resultCount = 0);
        let allWords = recognizedText.split(" ");
        allWords.forEach(wrd => {
            let rItem = this.etalonWords.find(rw => rw.text.toLowerCase() == wrd.toLowerCase());
            if (rItem) {
                rItem.resultCount++;
            }
        });
        AppGlobal.dispatch({type:"ActSetLastRecognizedText",text:recognizedText,recognizedResult:this.etalonWords})
    }

    findStartCommandWord(text: string) {
        let result = this.startCommandWords.some(sw => text.toLowerCase().includes(sw));
        return result;
    }

    processCommand(text: string) {
        let fres = voiceCommandWords.find(vci => vci.words.some(w=>text.toLowerCase().includes(w)));
        if (fres) {
            let command = fres.key;
            AppGlobal.dispatch({type:"ActExecVoiceCommand",command:command});
            this.isCommandMode = false;
        }
    }

}

export const SRResultTextAnalyzer = new SRResultTextAnalyzerClass();