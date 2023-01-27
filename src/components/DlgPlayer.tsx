import React, { FunctionComponent, useState, useEffect } from 'react';
import { AppGlobal } from '../App';
import { AppStatusEnum, IAppReducerstate, appDataHelper, langEnum,IDialogItem,ConfigSettings } from '../AppData';
import { SayButtonWrapper } from './SayButtonWrapper';
import SRecognizer, { SRCommand } from './SRecognizer';
import { SRResultTextAnalyzer,VoiceCommand } from './SRResultAnalyzer';
import {ColorWords,NumUpDown} from './ColorWords';

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

    const selectNewItem = (newItemIndex:number) =>{
        AppGlobal.dispatch({ type: "ActExecSRCommand", command: SRCommand.StopListen });
        AppGlobal.dispatch({ type: "ActExecVoiceCommand", command: VoiceCommand.NoCommand });
        AppGlobal.dispatch({ type: "ActSelectItem", newIndex: newItemIndex });
        let newDlgItem = AppGlobal.state.itemsRaw[newItemIndex] as IDialogItem;
        SRResultTextAnalyzer.SetEtalonText(newDlgItem.p2.en);
        AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgPaused }); 
        setTimeout(() => {
            AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgStarted });                           
        }, 0);        
    }


    let selItem = appDataHelper.getSelectedDlgItem();
    const handleBtnStartPause = () => {
        if(props.appState.AppStatus === AppStatusEnum.DlgPaused){
            AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgStarted });
            let nextDlgItemIndex = appDataHelper.getNextDlgItemIndex();
            AppGlobal.dispatch({ type: 'ActSelectItem', newIndex: nextDlgItemIndex });            
            let nextDlgItem = AppGlobal.state.itemsRaw[nextDlgItemIndex] as IDialogItem;
            SRResultTextAnalyzer.SetEtalonText(nextDlgItem.p2.en);
        } else {
            AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgPaused });
        }
    };
    const handleBeforeSay = (sayTextItemIndex:number) => {
        let p=props;
        if (sayTextItemIndex == 0 ) {
            if(props.appState.AppStatus === AppStatusEnum.DlgSayAnswer){
                return false;
            }
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
        if(ConfigSettings.dlgRepeat()){
            setTimeout(() => {
                AppGlobal.dispatch({type:"ActExecSRCommand",command:SRCommand.StopListen});
                AppGlobal.dispatch({type:"ActSetAppStatus",newStatus:AppStatusEnum.DlgSayAnswer});
            }, 5000);
        }
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
    let playBtnClassStr = (isPausedStatus ? "toolbar-button toolbar-button__disabled" : "toolbar-button toolbar-button__enabled");
    let microponeBtnClassStr = (props.appState.SRecognizeCmd == SRCommand.StartListen?"img-microphoneOn":"img-microphoneOff");
    let sayTextItems:any[] = [];
    if(selItem){
        sayTextItems = [{ sayText: selItem.p1.en }];        
        if(props.appState.selectedSentenceIndex === 0 ){
            sayTextItems.push({ sayText: selItem!.p2.en });
        } else {
            let sentencies = selItem!.p2.en.split(".");
            let senttxt = sentencies[props.appState.selectedSentenceIndex-1];
            sayTextItems.push({sayText:senttxt});
        }
    }    
    let nudValue:any = props.appState.selItemIndex;
    let nudLbDisabled = appDataHelper.dlgItemsHistoryStack.length<2;
    if(nudValue === -1){
        nudValue = "";
    }
    return (
        <div className="splayer-page">
            <div className="splayer-page__toolbar">
                <button className={playBtnClassStr} onClick={handleBtnStartPause} >
                    <div className={"img-play"} />
                </button>
                <NumUpDown value={nudValue} leftBtnDisabled={nudLbDisabled} onLeftBtnClick={()=>{
                        let prevIndex = appDataHelper.getPrevDlgItemIndex();
                        if(prevIndex !== -1){
                            selectNewItem(prevIndex);
                        }
                    }} onRightBtnClick={()=>{
                        let nextIndex = appDataHelper.getNextDlgItemIndex();
                        selectNewItem(nextIndex);                        
                    }} />
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
                <SayButtonWrapper sayItemQueue={sayTextItems}
                    onBeforeSay={handleBeforeSay} onAllItemsSaid={handleAllSayItemsSaid} />}

        </div> 
    );
} 