import {langEnum} from './SPlayer';


function devideWordsContainingHyphen(inStr:string){
    let result = inStr.replace(/-/g, " ");
    return result;
  }
  
  function filterUnnecessarySymbols(inStr: string) {
    let result = inStr.replace(/[\.]/g, "");
    result = devideWordsContainingHyphen(result);
    return result;
  }
  
  
  interface WordCount {
    word: string,
    count: number
  }
  
  
  function getWordCounts(inStr: string): WordCount[] {
    let clearStr = filterUnnecessarySymbols(inStr.toLowerCase());
    let words = clearStr.split(" ").sort();
    let result: WordCount[] = [];
    for (let i = 0; i < words.length; i++) {
      let currWord = words[i];
      let wordCountItem = result.find(itm => itm.word == currWord);
      if (wordCountItem) {
        wordCountItem.count++;
      } else {
        let newWcnt: WordCount = { word: currWord, count: 1 };
        result.push(newWcnt);
      }
    }
    return result;
  }

  export enum VoiceCommand{
    NoCommand="NoCommand",
    StopListenAndGiveResult="StopListenAndGiveResult",
    GoNextItem="GoNextItem",
    ClearListenResultAndListenAgain="ClearListenResultAndListenAgain"
  }
  

  export interface ICompareResult{
    command:VoiceCommand|undefined;
    missingWords:WordCount[];
    totalWCount : number;
    missingWcount: number;
    evaluationText: string;
    evaluationTextLanguage: langEnum
  }


interface IVoiceCommandItem{
  key:VoiceCommand,
  words:string[]
}

const voiceCommandWords:IVoiceCommandItem[]=[
  {key:VoiceCommand.StopListenAndGiveResult,words:["yeah","yes"]},
  {key:VoiceCommand.GoNextItem,words:["next"]},
  {key:VoiceCommand.ClearListenResultAndListenAgain,words:["again"]},
];

interface IRecognizeCommandResult{
  command:VoiceCommand;
  textBeforeCommand:string;
}

function recognizeCommand(testStr:string):IRecognizeCommandResult{
  //testStr = "Pocoyo Coco yeah go go yeah";
  let tx = testStr.toLowerCase();
  let startCommandWords = ["google","coco","go go","oh"];
  let startWrd = "";
  let getCommandText = ()=>{
      let stWrd = startCommandWords.find(wrd=>tx.lastIndexOf(wrd)>-1);
      if(stWrd){
        startWrd = stWrd;
        return tx.substring(tx.lastIndexOf(stWrd)+stWrd.length);
      }
      return "";
  };
  let cmdText = getCommandText();
  if(!cmdText){
    return {command:VoiceCommand.NoCommand,textBeforeCommand:testStr};
  }  
  let command = voiceCommandWords.find(patternItems=>patternItems.words.find(wrd=>cmdText.includes(wrd))!=undefined)
  let txBeforeCommand = tx.substring(0,tx.indexOf(startWrd))
  if(command){
    return {command:command.key,textBeforeCommand:txBeforeCommand};
  }
  return {command:VoiceCommand.NoCommand,textBeforeCommand:txBeforeCommand};
}


interface IWrongRecognizePattern{
  key:string;
  val:string[];
}

const WrongRecognizePatterns:IWrongRecognizePattern[]=[
  {key:"script tag",val:["kryptek","prepdeck","cryptic","ripta"]},
];


function applyPatterns(etalonStr:string, testStr:string):string{
  let tstWcnt = getWordCounts(testStr);
  let result = testStr;
  tstWcnt.forEach(wcnt=>{
    WrongRecognizePatterns.forEach(pattern=>{
       if(!etalonStr.toLowerCase().includes(pattern.key)){
          return false;
       }
       let pv = pattern.val.find(s=>s==wcnt.word);
       if(pv){
          result = result.replace(pv,pattern.key);
       }
    })
  });
  return result;
}

export default function compareResult(etalonStr: string, wholeTestStr: string):ICompareResult {
    let cmdRecognResult = recognizeCommand(wholeTestStr);
    let testStr = cmdRecognResult.textBeforeCommand;
    testStr = applyPatterns(etalonStr,testStr);
    let etalonWCnt = getWordCounts(etalonStr);
    let totalWcnt = 0;
    let testWCnt = getWordCounts(testStr);
    let missingWords: WordCount[] = [];
    let missingWCnt = 0;
    
    for (let i = 0; i < etalonWCnt.length; i++) {
      let eItm = etalonWCnt[i];
      totalWcnt += eItm.count;
  
      let tItm = testWCnt.find(itm => itm.word == eItm.word);
      if(tItm){
        if(eItm.count>tItm.count){
          let mwc = eItm.count - tItm.count
          let newWcnt: WordCount = { word: eItm.word, count: mwc };
          missingWords.push(newWcnt);
          missingWCnt += mwc;
        }      
      } else {
        missingWords.push(eItm);
        missingWCnt += eItm.count;
      }
    }
    let evLang = langEnum.ruRu;
    let koeff= missingWCnt/totalWcnt;
    let evText = 100 - Math.round(koeff*100)+" процентов";
    if(koeff<=0.1){
      evLang = langEnum.enUs;
      evText="Excellent!";
    }
    if(koeff<0.25 && koeff>0.1){
      evLang = langEnum.enUs;
      evText="Good !";
    }
    if(koeff>0.8){
      //evText="Чего молчим, кого ждем?";
    }
 
    let result:ICompareResult = {
      command:cmdRecognResult.command,
      totalWCount:totalWcnt,
      missingWcount:missingWCnt,
      missingWords:missingWords,
      evaluationText:evText,
      evaluationTextLanguage:evLang};
    //console.log("instr:",wholeTestStr,result);    
    return result;
  }