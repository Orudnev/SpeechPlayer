import React,{useReducer,useEffect,useState} from 'react';
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  Link  
} from "react-router-dom";
import './App.css';
import {appReducer,appInitState,DispatchFunc,AppAction } from "./AppData";
import {SelectDataSource} from "./components/SelectDataSource";
import { RoutePath } from './AppData';
import { DlgPlayer } from './components/DlgPlayer';
import { PhraseMemorizer } from './components/PhraseMemorizer';
import SRecognizer from './components/SRecognizer';
import {SRResultTextAnalyzer} from './components/SRResultAnalyzer';

import {SPlayer} from "./components/SPlayer";
import test from './test';
import {ColorWords,IColorWordsProps} from "./components/ColorWords";
import { ConfigPage } from './components/ConfigPage';

export const AppGlobal = {
  navigate:(url:any)=>{},
  dispatch:(action:AppAction)=>{},
  state:appInitState
}

const testCWprops:IColorWordsProps = {
  text:"mama myla, ramu ramu, myla mama. gyr gyg blablabla. Chu-Chu-Chy stuchat kopyta.",
  selectedSentenceIndex:2, 
  recResult:[
    {etalonCount:2,resultCount:1,text:"myla"},
    {etalonCount:2,resultCount:2,text:"mama"},
]
}


function App() {
  AppGlobal.navigate = useNavigate();
  const [state, dispatch] = useReducer(appReducer, appInitState);
  AppGlobal.state = state;
  AppGlobal.dispatch = dispatch;
  return ( 
    <div> 
      <Routes>
        <Route path={"/"} element={<SelectDataSource dispatch={dispatch} />} />
        <Route path={RoutePath.root} element={<SelectDataSource dispatch={dispatch} />} />
        <Route path={RoutePath.speech} element={<div>play speech</div>}/>
        <Route path={RoutePath.dialog} element={<DlgPlayer appState={state} />} /> 
        <Route path={RoutePath.phraseMemorizer} element={<PhraseMemorizer appState={state} />} /> 
        <Route path={RoutePath.config} element={<ConfigPage />} /> 
      </Routes>
      <SRecognizer command={state.SRecognizeCmd} onChange={(rtext:string)=>{
            if(rtext){
                setTimeout(()=>{
                  //dispatch({type:"ActSetLastRecognizedText",text:rtext});
                  SRResultTextAnalyzer.AddNewText(rtext);
                },0);
            }                    
            console.log(rtext); 
        }} />

    </div> 
    );
  }

export default App;
