import { AppGlobal } from "../App";
import reportWebVitals from "../reportWebVitals";


function devideWordsContainingHyphen(inStr: string) {
    let result = inStr.replace(/-/g, " ");
    return result;
}

function filterUnnecessarySymbols(inStr: string) {
    let result = inStr.replace(/[\.]/g, "");
    result = devideWordsContainingHyphen(result);
    return result;
}

export enum VoiceCommand {
    NoCommand = "NoCommand",
    MarkItemAsPassed = "MarkItemAsPassed",
    GoNextItem = "GoNextItem",
    ClearListenResultAndListenAgain = "ClearListenResultAndListenAgain",
    GoNextItemSet = "GoNextItemSet"
}

interface SRResultWord {
    text: string;
    etalonCount: number;
    resultCount: number;
}

interface IVoiceCommandItem {
    key: VoiceCommand,
    words: string[]
}

const voiceCommandWords: IVoiceCommandItem[] = [
    { key: VoiceCommand.MarkItemAsPassed, words: ["yeah", "yes"] },
    { key: VoiceCommand.GoNextItem, words: ["next"] },
    { key: VoiceCommand.ClearListenResultAndListenAgain, words: ["again"] },
    { key: VoiceCommand.GoNextItemSet, words: ["app"] },
    { key: VoiceCommand.ClearListenResultAndListenAgain, words: ["down"] },
];


class SRResultTextAnalyzerClass {
    prevRecognizedText = "";
    etalonText = "";
    allWords: SRResultWord[] = [];
    etalontWords: SRResultWord[] = [];
    isCommandMode = false;
    startCommandWords = ["google", "coco", "go go", "oh"];

    SetEtalonText(text: string) {
        this.etalonText = text;
        let words = filterUnnecessarySymbols(text).split(" ");
        words.forEach(wrd => {
            let rItem = this.etalontWords.find(rw => rw.text == wrd.toLocaleLowerCase());
            if (rItem) {
                rItem.etalonCount++;
            } else {
                let newItem: SRResultWord = {
                    text: wrd.toLocaleLowerCase(),
                    etalonCount: 1,
                    resultCount: 0
                }
                this.etalontWords.push(newItem);
            }
        });
    }

    AddNewText(recognizedText: string) {
        if (recognizedText == undefined) {
            let s = 1;
        }
        recognizedText = filterUnnecessarySymbols(recognizedText);
        let diffText = ""
        let equals = false;
        for (let pos = 0; pos < this.prevRecognizedText.length; pos++) {
            if (pos < recognizedText.length) {
                let prevChar = this.prevRecognizedText.charAt(pos);
                let currChar = recognizedText.charAt(pos);
                if (prevChar.toLowerCase() == currChar.toLowerCase()) {
                    equals = true;
                    continue;
                } else {
                    if (!equals) {
                        break;
                    }
                    diffText += currChar;
                }
            }
        }

        if (!diffText) {
            diffText = recognizedText;
        }

        if (this.isCommandMode) {
            this.processCommand(diffText);
            return;
        } else {
            console.log("diffText:", diffText);
            if (this.findStartCommandWord(diffText)) {
                this.isCommandMode = true;
                return;
            }
        }

        let words = diffText.split(" ");
        words.forEach(wrd => {
            let rItem = this.etalontWords.find(rw => rw.text == wrd.toLocaleLowerCase());
            if (rItem) {
                rItem.resultCount++;
            }
            let awItem = this.allWords.find(wi => wi.text == wrd.toLocaleLowerCase());
            if (awItem) {
                awItem.resultCount++;
            }
            else {
                let newItem: SRResultWord = {
                    text: wrd.toLocaleLowerCase(),
                    etalonCount: 0,
                    resultCount: 1
                }
                this.allWords.push(newItem);
            }
        });
        this.prevRecognizedText = recognizedText;
    }

    findStartCommandWord(text: string) {
        let result = this.startCommandWords.some(sw => text.includes(sw));
        return result;
    }

    processCommand(text: string) {
        let fres = voiceCommandWords.find(vci => vci.words.some(w=>text.toLocaleLowerCase().includes(w)));
        if (fres) {
            let command = fres.key;
            AppGlobal.dispatch({type:"ActExecVoiceCommand",command});
        }
    }

}

export const SRResultTextAnalyzer = new SRResultTextAnalyzerClass();