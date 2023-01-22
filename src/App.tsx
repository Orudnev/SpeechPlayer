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
import SRecognizer from './components/SRecognizer';
import {SRResultTextAnalyzer} from './components/SRResultAnalyzer';

import {SPlayer} from "./components/SPlayer";
import test from './test';

export const AppGlobal = {
  navigate:(url:string)=>{},
  dispatch:(action:AppAction)=>{},
  state:appInitState
}


function App() {
  AppGlobal.navigate = useNavigate();
  const [state, dispatch] = useReducer(appReducer, appInitState);
  AppGlobal.state = state;
  AppGlobal.dispatch = dispatch;
  return ( 
    <div> 
      <Routes>
        <Route path={RoutePath.root} element={<SelectDataSource dispatch={dispatch} />} />
        <Route path={RoutePath.speech} element={<div>play speech</div>}/>
        <Route path={RoutePath.dialog} element={<DlgPlayer appState={state} />} /> 
      </Routes>
      <SRecognizer command={state.SRecognizeCmd} onChange={(rtext:string)=>{
            if(rtext){
                setTimeout(()=>{
                  //dispatch({type:"ActSetLastRecognizedText",text:rtext});
                  SRResultTextAnalyzer.AddNewText(rtext);
                },0);
                 
                //
            }                    
            console.log(rtext); 
        }} />

    </div> 
    );
  }

export default App;
