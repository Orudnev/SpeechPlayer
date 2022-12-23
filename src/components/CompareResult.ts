import {langEnum} from './SPlayer';


function devideWordsContainingHyphen(inStr:string){
    let result = inStr.replace(/-/g, " ");
    return result;
  }
  
  function filterUnnecessarySymbols(inStr: string) {
    let result = inStr.replace(/[\.,]/g, "");
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
  
  export interface ICompareResult{
    missingWords:WordCount[];
    totalWCount : number;
    missingWcount: number;
    evaluationText: string;
    evaluationTextLanguage: langEnum
  }

export default  function compareResult(etalonStr: string, testStr: string):ICompareResult {
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
      evText="Чего молчим, кого ждем?";
    }

    let result:ICompareResult = {totalWCount:totalWcnt,missingWcount:missingWCnt,missingWords:missingWords,evaluationText:evText,evaluationTextLanguage:evLang};
    return result;
  }