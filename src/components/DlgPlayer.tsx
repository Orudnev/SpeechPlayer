import React, { FunctionComponent, useState,useEffect } from 'react';
import { AppGlobal } from '../App';
import { AppStatusEnum,IAppReducerstate } from '../AppData';

interface IDlgPlayerProps {
    appState:IAppReducerstate;
}

export const DlgPlayer: FunctionComponent<IDlgPlayerProps> = (props) => {
    let startButtonClassStr = (true ? "toolbar-button toolbar-button__enabled" : "toolbar-button toolbar-button__disabled");
    let pauseButtonClassStr = (true ? "img-play" : "img-pause");
    let moveNextItemClassStr = (true ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled");
    let playBtnClassStr = (props.appState.AppStatus==AppStatusEnum.DlgPaused?"toolbar-button":"toolbar-button toolbar-button__disabled");
    let pauseBtnClassStr = (props.appState.AppStatus!=AppStatusEnum.DlgPaused?"toolbar-button":"toolbar-button toolbar-button__disabled");
    useEffect(()=>{AppGlobal.dispatch({type:'ActSetAppStatus',newStatus:AppStatusEnum.DlgPaused})},[]);
    return ( 
        <div className="splayer-page">
            <div className="splayer-page__toolbar">
                <button className={playBtnClassStr} onClick={() => {
                        AppGlobal.dispatch({type:'ActSetAppStatus',newStatus:AppStatusEnum.DlgShowItemAndSayQuestion})
                    }}>
                    <div className={"img-play"} />
                </button>
                <button className={pauseBtnClassStr} onClick={() => {
                        AppGlobal.dispatch({type:'ActSetAppStatus',newStatus:AppStatusEnum.DlgPaused})
                    }}>
                    <div className={"img-pause"} />
                </button>
                <button className={moveNextItemClassStr} onClick={() => {
                    
                    }}>next
                </button>
                <button className={"toolbar-button"} onClick={() => {
                    
                    }}>
                    <div className="img-config" />
                </button>
            </div>
        </div>
    );
}