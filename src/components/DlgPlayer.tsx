import React, { FunctionComponent, useState, useEffect } from 'react';
import { AppGlobal } from '../App';
import { AppStatusEnum, IAppReducerstate, appDataHelper, langEnum,IDialogItem,ConfigSettings } from '../AppData';
import { SayButtonWrapper } from './SayButtonWrapper';
import SRecognizer, { SRCommand } from './SRecognizer';
import { SRResultTextAnalyzer,VoiceCommand } from './SRResultAnalyzer';
import {ColorWords} from './ColorWords';

interface IDlgPlayerProps {
    appState: IAppReducerstate;
}

export const DlgPlayer: FunctionComponent<IDlgPlayerProps> = (props) => {
    useEffect(() => {
        if (props.appState.voiceCommand == VoiceCommand.GoNextItem) {
            let nextIndex = appDataHelper.getNextDlgItemIndex();
            AppGlobal.dispatch({ type: "ActExecSRCommand", command: SRCommand.StopListen });
            AppGlobal.dispatch({ type: "ActExecVoiceCommand", command: VoiceCommand.NoCommand });
            AppGlobal.dispatch({ type: "ActSelectItem", newIndex: nextIndex });
        } 
    }, [props.appState.voiceCommand]);

    let selItem = appDataHelper.getSelectedDlgItem();
    const handleBtnStart = () => {
        AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgShowItemAndSayQuestion });
        let nextDlgItemIndex = appDataHelper.getNextDlgItemIndex();
        let nextDlgItem = AppGlobal.state.itemsRaw[nextDlgItemIndex] as IDialogItem;
        AppGlobal.dispatch({ type: 'ActSelectItem', newIndex: nextDlgItemIndex });            
        SRResultTextAnalyzer.SetEtalonText(nextDlgItem.p2.en);
    };
    const handleBtnPause = () => {
        AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgPaused });
    };
    const handleBeforeSay = (sayTextItemIndex:number) => {
        if (sayTextItemIndex == 0) {
            AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgShowItemAndSayQuestion });
        }
        if (sayTextItemIndex == 1) {
            AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgSayAnswer });
            if(!ConfigSettings.dlgSayAnswer()){
                handleAllSayItemsSaid();
                return false;
            }
        }
        return true;
    };
    const handleAllSayItemsSaid = () => {
        AppGlobal.dispatch({ type: 'ActExecSRCommand', command: SRCommand.StartListen });
    };


    let questionTextJsxShow = false;
    let answerTextJsxShow = false;
    let popupCommandJsxShow = false;
    let sayButtonWrapperJsxShow = false;
    if (selItem && appDataHelper.isDlgStarted()) {
        questionTextJsxShow = true;
        answerTextJsxShow = true;
        popupCommandJsxShow = (props.appState.voiceCommand != VoiceCommand.NoCommand);
        sayButtonWrapperJsxShow = props.appState.SRecognizeCmd != SRCommand.StartListen;
    }

    let isPausedStatus = (props.appState.AppStatus == AppStatusEnum.DlgPaused);
    let moveNextItemClassStr = (true ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled");
    let playBtnClassStr = (isPausedStatus ? "toolbar-button" : "toolbar-button toolbar-button__disabled");
    let pauseBtnClassStr = (!isPausedStatus ? "toolbar-button" : "toolbar-button toolbar-button__disabled");
    let microponeBtnClassStr = (props.appState.SRecognizeCmd == SRCommand.StartListen?"img-microphoneOn":"img-microphoneOff");
    
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
                <button className={"toolbar-button"} onClick={() => {

                }}>
                    <div className={microponeBtnClassStr} />
                </button>
            </div>
            {questionTextJsxShow &&
                <div>
                    <h3>Question:</h3>
                    <div>{selItem!.p1.en}</div>
                </div>}
            {answerTextJsxShow &&
                <div>
                    <h3>Answer:</h3>
                    <ColorWords text={selItem!.p2.en} recResult={props.appState.lastRecognizedResult} selectedSentenceIndex={props.appState.selectedSentenceIndex} />
                </div>}
            {popupCommandJsxShow &&
                <div className="popup-container">
                    <div className="popup-content">Voice command</div>
                </div>}
            {sayButtonWrapperJsxShow &&
                <SayButtonWrapper sayItemQueue={[{ sayText: selItem!.p1.en }, { sayText: selItem!.p2.en }]}
                    onBeforeSay={handleBeforeSay} onAllItemsSaid={handleAllSayItemsSaid} />}

        </div> 
    );
} 