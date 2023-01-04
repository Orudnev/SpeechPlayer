import React from 'react';
import './App.css';
import {SPlayer} from "./components/SPlayer";
import test from './test';

function App() {
  test();
  return (
    <div className="App">
      <SPlayer />
    </div>
  );
}

export default App;
