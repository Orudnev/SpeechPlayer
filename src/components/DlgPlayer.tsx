import React, { FunctionComponent, useState, useEffect } from 'react';
import { AppGlobal } from '../App';
import { AppStatusEnum, IAppReducerstate,appDataHelper, langEnum } from '../AppData';
import { SayButtonWrapper } from './SayButtonWrapper';
import SRecognizer, { SRCommand } from './SRecognizer';

interface IDlgPlayerProps {
    appState: IAppReducerstate;
}

export const DlgPlayer: FunctionComponent<IDlgPlayerProps> = (props) => {
    useEffect(() => { AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgPaused }) }, []);
    const handleBtnStart = () => {
        AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgShowItemAndSayQuestion });
        let nextDlgItem = appDataHelper.getNextDlgItemIndex();        
        AppGlobal.dispatch({type:'ActSelectItem',newIndex:nextDlgItem});
        AppGlobal.dispatch({type:'ActExecSRCommand',command:SRCommand.Start});
    }
    const handleBtnPause = () => {
        AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgPaused });
    }
    
    let selItem = appDataHelper.getSelectedDlgItem();
    let dlgItemContentJsx = <div/>
    if(selItem && appDataHelper.isDlgStarted()){
        let questionTextJsx = 
            <div>
                <h3>Question:</h3>
                <div>{selItem.p1.en}</div>
            </div>;
        let answerTextJsx = 
            <div>
                <h3>Answer:</h3>
                <div>{selItem.p2.en}</div>
            </div>;
        

        dlgItemContentJsx = 
            <div id="dlgItemContent" >
                {questionTextJsx}
                {answerTextJsx}
                <SayButtonWrapper sayItemQueue={[{sayText:selItem.p1.en},{sayText:selItem.p2.en}]} 
                    onBeforeSay={(itemIndex)=>{
                        console.log(itemIndex);
                        return true;
                    }} />
            </div>; 
    } 

    let isPausedStatus = (props.appState.AppStatus == AppStatusEnum.DlgPaused);
    let moveNextItemClassStr = (true ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled");
    let playBtnClassStr = (isPausedStatus ? "toolbar-button" : "toolbar-button toolbar-button__disabled");
    let pauseBtnClassStr = (!isPausedStatus ? "toolbar-button" : "toolbar-button toolbar-button__disabled");
    return (
        <div className="splayer-page">
            <div className="splayer-page__toolbar">
                <button className={playBtnClassStr} onClick={handleBtnStart} disabled={!isPausedStatus}>
                    <div className={"img-play"} />
                </button>
                <button className={pauseBtnClassStr} disabled={isPausedStatus} onClick={handleBtnPause}>
                    <div className={"img-pause"} />
                </button>
                <button className={moveNextItemClassStr} onClick={() => {

                }}>next
                </button>
                <button className={"toolbar-button"} onClick={() => {

                }}>
                    <div className="img-config" />
                </button>
                <SRecognizer command={props.appState.SRecognizeCmd} onChange={(text:string)=>{
                    //AppGlobal.dispatch({type:"ActExecSRCommand",command:SRCommand.Reset});
                    console.log(text); 
                }} />
            </div>
            {dlgItemContentJsx}
        </div>
    );
}