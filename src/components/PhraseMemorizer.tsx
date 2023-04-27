import React, { FunctionComponent, useState, useEffect } from 'react';
import { AppGlobal } from '../App';
import { AppStatusEnum, IAppReducerstate, appDataHelper, langEnum,IDialogItem,ConfigSettings,RoutePath } from '../AppData';
import { SayButtonWrapper } from './SayButtonWrapper';
import SRecognizer, { SRCommand } from './SRecognizer';
import { SRResultTextAnalyzer,VoiceCommand } from './SRResultAnalyzer';
import {ColorWords,NumUpDown} from './ColorWords';
import {ISayItem} from './SayButtonWrapper';
import { SayText } from './SayText';
import { waitWhile } from './AsyncHelper';


interface IDlgPlayerProps {
    appState: IAppReducerstate;
}

function GetTextFromSayItem(p:any):ISayItem{
    let result:ISayItem = {lang:langEnum.enUs,sayText:""};
    if(p.en){
        result.sayText = p.en;
    }
    if(p.ru){
        result.lang = langEnum.ruRu;
        result.sayText = p.ru;
    }
    return result; 
}

export const PhraseMemorizer: FunctionComponent<IDlgPlayerProps> = (props) => {
    useEffect(() => {
        const appStatus = props.appState.AppStatus;
        if (props.appState.voiceCommand === VoiceCommand.GoNextItem || appStatus === AppStatusEnum.DlgStopFakeListen) {
            let nextIndex = appDataHelper.getNextDlgItemIndex();
            selectNewItem(nextIndex);
        } 
        if (props.appState.voiceCommand === VoiceCommand.MarkItemAsPassed){
            appDataHelper.saveDlgItemResult(true);
            let nextIndex = appDataHelper.getNextDlgItemIndex();
            selectNewItem(nextIndex);
        }
    }, [props.appState.voiceCommand,props.appState.AppStatus]);
    //console.log(props.appState.AppStatus);
    let selItem = appDataHelper.getSelectedDlgItem();



    //Actions
    const selectNewItem = (newItemIndex:number) =>{
        AppGlobal.dispatch({ type: "ActExecSRCommand", command: SRCommand.StopListen });
        AppGlobal.dispatch({ type: "ActExecVoiceCommand", command: VoiceCommand.NoCommand });
        AppGlobal.dispatch({ type: "ActSelectItem", newIndex: newItemIndex });
        let newDlgItem = AppGlobal.state.itemsRaw[newItemIndex] as IDialogItem;
        let etltext = "";
        if(newDlgItem.p2.en) etltext = newDlgItem.p2.en;
        if(newDlgItem.p2.ru) etltext = newDlgItem.p2.ru;
        SRResultTextAnalyzer.SetEtalonText(etltext);
        AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgPaused }); 
        setTimeout(() => {
            AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgStarted });                           
        }, 200);        
    }

    const gotoNextItem = ()=>{
        let nextIndex = appDataHelper.getNextDlgItemIndex();
        selectNewItem(nextIndex);
    }

    //Handlers
    const handleBtnStartPause = () => {
        if(props.appState.AppStatus === AppStatusEnum.DlgPaused){
            AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgStarted });
            let nextDlgItemIndex = appDataHelper.getNextDlgItemIndex();
            AppGlobal.dispatch({ type: 'ActSelectItem', newIndex: nextDlgItemIndex });            
            let nextDlgItem = AppGlobal.state.itemsRaw[nextDlgItemIndex] as IDialogItem;
            let etltext = "";
            if(nextDlgItem.p2.en) etltext = nextDlgItem.p2.en;
            if(nextDlgItem.p2.ru) etltext = nextDlgItem.p2.ru;    
            SRResultTextAnalyzer.SetEtalonText(etltext);
        } else {
            AppGlobal.dispatch({type:"ActExecSRCommand",command:SRCommand.StopListen})
            AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgPaused });
        }
    };

    // const handleBeforeSay = (sayTextItemIndex:number) => {
    //     let p=props;
    //     if (sayTextItemIndex == 0 ) {
    //         if(props.appState.AppStatus === AppStatusEnum.DlgSayAnswer){
    //             return false;
    //         }
    //         AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgShowItemAndSayQuestion });
    //     }
    //     if (sayTextItemIndex == 1) {
    //         AppGlobal.dispatch({ type: 'ActSetAppStatus', newStatus: AppStatusEnum.DlgSayAnswer });
    //         if(!ConfigSettings.dlgSayAnswer()){
    //             handleAllSayItemsSaid();
    //             return false;
    //         }
    //     }
    //     return true;
    // };
    // const handleAllSayItemsSaid = () => {
    //     let lng = langEnum.enUs;
    //     if(selItem && selItem.p2.ru){
    //         lng = langEnum.ruRu;
    //     }
    //     if(ConfigSettings.prop('dlgEnableSR')){
    //         AppGlobal.dispatch({ type: 'ActExecSRCommand', command: SRCommand.StartListen,lang:lng});
    //     } else {
    //         appDataHelper.startFakeListening();
    //     }

    //     if(ConfigSettings.dlgRepeat()){
    //         setTimeout(() => {
    //             AppGlobal.dispatch({type:"ActExecSRCommand",command:SRCommand.StopListen});
    //             AppGlobal.dispatch({type:"ActSetAppStatus",newStatus:AppStatusEnum.DlgSayAnswer});
    //         }, 5000);
    //     }
    // };


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
    let answerText = " "; 
    if(selItem){
        const sayTextItems:ISayItem[] = [];
        const questionItem = GetTextFromSayItem(selItem.p1);
        const answerItem = GetTextFromSayItem(selItem.p2);    
        if(selItem.p2.ru){
            answerText = (selItem.p2.ru)    
        }
        if(selItem.p2.en){
            answerText = (selItem.p2.en)    
        }
        if (props.appState.AppStatus === AppStatusEnum.DlgStarted){            
            AppGlobal.dispatch({type:"ActSetAppStatus",newStatus:AppStatusEnum.DlgShowItemAndSayQuestion});
        }
        if(props.appState.AppStatus === AppStatusEnum.DlgShowItemAndSayQuestion){
            SayText.addMessage(questionItem,()=>{
                if(ConfigSettings.dlgSayAnswer()){                
                    AppGlobal.dispatch({type:"ActSetAppStatus",newStatus:AppStatusEnum.DlgSayAnswer});
                } else if(ConfigSettings.prop('dlgEnableSR')){
                    AppGlobal.dispatch({type:"ActSetAppStatus",newStatus:AppStatusEnum.DlgStartListen});
                } else {
                    // (async ()=>{
                    //     await waitWhile(()=>{return !SayText.speaking()});
                    //     gotoNextItem();
                    // })();
                }    
            });
        }
        if (props.appState.AppStatus === AppStatusEnum.DlgSayAnswer){            
            SayText.addMessage(answerItem,()=>{
                AppGlobal.dispatch({type:"ActSetAppStatus",newStatus:AppStatusEnum.DlgStartFakeListen});                    
            });
        }
        if (props.appState.AppStatus === AppStatusEnum.DlgStartFakeListen){
            setTimeout(()=>{
                AppGlobal.dispatch({type:"ActSetAppStatus",newStatus:AppStatusEnum.DlgStopFakeListen});   
            },1000);
        }         
        if (props.appState.AppStatus === AppStatusEnum.DlgStopFakeListen){
            //gotoNextItem();
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
                        gotoNextItem();
                    }} />
                <button className={"toolbar-button"} onClick={() => {
                        AppGlobal.navigate(RoutePath.config);
                     }}>
                    <div className="img-config" />
                </button>
                {ConfigSettings.prop('dlgEnableSR') && 
                    <button className={"toolbar-button"} onClick={() => {

                    }}>
                        <div className={microponeBtnClassStr} />
                    </button>
                }
            </div>
            {questionTextJsxShow &&
                <div>
                    <h3>Question:</h3>
                    {selItem && selItem.p1.en && <div className={"phrase-text"}>{selItem!.p1.en}</div>}
                    {selItem && selItem.p1.ru && <div className={"phrase-text"}>{selItem!.p1.ru}</div>}
                </div>}
            {answerTextJsxShow &&
                <div>
                    <h3>Answer:</h3>
                    <ColorWords text={answerText} recResult={props.appState.lastRecognizedResult} selectedSentenceIndex={props.appState.selectedSentenceIndex} />
                    <div>{SRResultTextAnalyzer.diffText}</div>
                </div>}
            {popupCommandJsxShow &&
                <div className="popup-container">
                    <div className="popup-content">Voice command</div>
                </div>}
            {/* {sayButtonWrapperJsxShow &&
                <SayButtonWrapper sayItemQueue={sayTextItems}
                    onBeforeSay={handleBeforeSay} onAllItemsSaid={handleAllSayItemsSaid} />} */}

        </div> 
    );
} 