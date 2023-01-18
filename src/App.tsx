import React,{useReducer,useEffect,useState} from 'react';
import {
  Routes,
  Route,
  useNavigate,
  Navigate,
  Link  
} from "react-router-dom";
import './App.css';
import {appReducer,appInitState} from "./AppData";
import {SelectDataSource} from "./components/SelectDataSource";
import { RoutePath } from './AppData';
import {SPlayer} from "./components/SPlayer";
import test from './test';

export const AppGlobal = {
  navigate:(url:string)=>{}
}


function App() {
  AppGlobal.navigate = useNavigate();
  const [state, dispatch] = useReducer(appReducer, appInitState);
  return ( 
    <div> 
      <Routes>
        <Route path={RoutePath.root} element={<SelectDataSource dispatch={dispatch} />} />
        <Route path={RoutePath.speech} element={<div>play speech</div>}/>
        <Route path={RoutePath.dialog} element={<div>play dialog</div>}/>
      </Routes>
    </div> 
    );
  }

export default App;
