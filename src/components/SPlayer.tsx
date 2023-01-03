import React, { createRef, useState } from 'react';
import JSZip from 'jszip';
//@ts-ignore
import { SayButton } from 'react-say';
import SRecognizer, { SRCommand } from './SRecognizer';
import compareResult, { ICompareResult, VoiceCommand } from './CompareResult';
import { wait, waitWhile, waitWhileWithTimeout } from './AsyncHelper';

export enum langEnum {
    enUs = "en-US",
    ruRu = "ru=RU"
}

enum lstorageKey {
    config = "config",
    results = "results"
}

interface IConfigSettings {
    mp3Enabled: boolean;
    enEnabled: boolean;
    ruEnabled: boolean;
    pause: number;
}

interface ISpeechItem {
    en: string;
    ru?: string;
    startTime?: number;
    endTime?: number;
}

interface IDialogueItem {
    p1: ISpeechItem;
    p2: ISpeechItem[];
}

type IItem = ISpeechItem | IDialogueItem;

function GetSpeechItem(item: IItem, person = "p2"): ISpeechItem {
    if (item.hasOwnProperty("en")) {
        return item as ISpeechItem;
    }
    if (item.hasOwnProperty("p1")) {
        let itm = item as any;
        return itm[person];
    }
    throw new Error("Unknown item format");
}

function GetItems(jsonObj: any): IItem[] {
    let firstItem = jsonObj.items[0] as IItem;
    let createISpeechInstance = (itm: ISpeechItem) => {
        let result = { en: itm.en, ru: itm.ru, startTime: itm.startTime, endTime: itm.endTime };
        return result;
    }
    let result: IItem[] = [];
    if (firstItem.hasOwnProperty("p1")) {
        result = jsonObj.items.map((itm: any) => {
            let person1 = createISpeechInstance(itm.p1);
            let p2Parts = itm.p2.en.split(/[.,]/);
            let person2 = p2Parts.map((itm: string) => createISpeechInstance({ en: itm }));

            return { p1: person1, p2: person2 };
        });
        return result;
    }
    result = jsonObj.items.map((itm: any) => createISpeechInstance(itm));
    return result;
}


interface ISPlayerState {
    file?: File,
    url?: string,
    currItemIndex: number,
    startTime: number,
    endTime: number,
    isMP3Playing: boolean,
    isSayBtnPlaying: boolean,
    SRecognizerCommand: SRCommand,
    SRecognitionCheckPassed: boolean,
    lastRecognitionResult?: ICompareResult,
    lang: langEnum,
    sayText: string,
    isStarted: boolean;
    isPaused: boolean;
    configPaneVisibility: boolean;
    configSettings: IConfigSettings;
    MoveNextItemAutomatically: boolean;
    items: IItem[];
}

const binToStringConverter = new FileReader();

const selector = (voices: any) => {
    return voices.find((voice: any) => voice.name === "Microsoft David - English (United States)");
    //Microsoft Mark - English (United States)    
    //Microsoft Zira - English (United States)
    //Microsoft Irina - Russian (Russia)
    //Microsoft Pavel - Russian (Russia)
    //Google US English
    //Google русский
}

interface IPauseTunerProps {
    parent: SPlayer;
}

const PauseTuner = (props: IPauseTunerProps) => {
    const handleMouseDown = (e: any) => {
        changePauseValue(e);
    };

    const changePauseValue = (e: any) => {
        let elmRect = e.target.getBoundingClientRect();
        let middleX = elmRect.left + elmRect.width / 2;
        let state = props.parent.state;
        let touchX = e.touches[0].clientX;
        let updateConfig = (updProps: any) => {
            let newConfig = { ...state.configSettings, ...updProps };
            props.parent.setState({ configSettings: newConfig });
        };
        if (touchX > middleX) {
            //right button clicked
            updateConfig({ pause: state.configSettings.pause + 1 });
        } else {
            //left button clicked
            updateConfig({ pause: state.configSettings.pause - 1 });
        }
        if (props.parent.touchState > 0) {
            setTimeout(() => changePauseValue(e), 100);
        }
    }


    return (
        <div className="pause-tuner prevent-select" onTouchStart={(e) => setTimeout(() => {
            handleMouseDown(e);
        }, 100)}>
            <div id="label" >pause</div>
            <div id="value">{props.parent.state.configSettings.pause}</div>
        </div>
    );
}


export class SPlayer extends React.Component<any, ISPlayerState> {
    aref: React.RefObject<HTMLAudioElement>;
    sayBtnWrapperRef: React.RefObject<HTMLDivElement>;
    touchState: number = 0;
    cmdStartDetected: boolean = false;
    constructor(props: any) {
        super(props);
        this.state = {
            file: undefined,
            url: undefined,
            isMP3Playing: false,
            isSayBtnPlaying: false,
            startTime: 0,
            endTime: 0,
            lang: langEnum.ruRu,
            currItemIndex: 0,
            sayText: "",
            isStarted: false,
            isPaused: false,
            SRecognitionCheckPassed: false,
            SRecognizerCommand: SRCommand.Stop,
            configPaneVisibility: false,
            configSettings: {
                mp3Enabled: true,
                enEnabled: true,
                ruEnabled: true,
                pause: 50, //unit: 0.1 second     
            },
            MoveNextItemAutomatically: true,
            items: []
        }
        this.aref = createRef();
        this.sayBtnWrapperRef = createRef();
        this.onBinToStringConverted = this.onBinToStringConverted.bind(this);
        this.langSelector = this.langSelector.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
    }

    langSelector(voices: any) {
        let enVoice = "Microsoft Mark - English (United States)";
        let ruVoice = "Google русский";
        let voiceName = (this.state.lang == langEnum.enUs ? enVoice : ruVoice);
        return voices.find((voice: any) => voice.name === voiceName);
    }

    componentDidMount(): void {
        binToStringConverter.addEventListener("loadend", this.onBinToStringConverted);
        window.addEventListener("touchstart", this.onTouchStart);
        window.addEventListener("touchend", this.onTouchEnd);
        let configStr = localStorage.getItem(lstorageKey.config);
        if (configStr) {
            let config = JSON.parse(configStr);
            this.setState({ configSettings: config });
        }
    }

    onTouchStart() {
        this.touchState++;
    }
    onTouchEnd() {
        this.touchState--;
    }

    componentWillUnmount(): void {
        binToStringConverter.removeEventListener("loadend", this.onBinToStringConverted);
        window.removeEventListener("touchstart", this.onTouchStart);
        window.removeEventListener("touchend", this.onTouchEnd);
    }

    onBinToStringConverted(e: any) {
        let strResult = e.srcElement.result;
        let incomingJson = JSON.parse(strResult);
        let iitems = GetItems(incomingJson);
        this.setState({ items: iitems, lang: langEnum.enUs, sayText: GetSpeechItem(iitems[0]).en });
    }

    loadFile(selFile: File) {
        JSZip.loadAsync(selFile as Blob)
            .then((zip) => {
                let fileNames = [];
                for (let prop in zip.files) {
                    fileNames.push(prop);
                }
                let jsonFileName = fileNames.find(itm => itm.includes(".json"));
                let mp3FileName = fileNames.find(itm => itm.includes(".mp3"));
                if (jsonFileName) {
                    zip.files[jsonFileName].async('blob').then((res: any) => {
                        binToStringConverter.readAsText(res);
                    });
                }
                if (mp3FileName) {
                    zip.files[mp3FileName].async('blob').then((res: any) => {
                        this.setState({ file: res, url: URL.createObjectURL(res as Blob) })
                    });
                }
            })

        // this.setState({ file: selFile, url: URL.createObjectURL(selFile as Blob) })
    }

    handlePauseButtonClick() {
        this.setState({ isPaused: !this.state.isPaused });
    }

    handleConfigButtonClick() {
        this.setState({ configPaneVisibility: !this.state.configPaneVisibility });
    }

    handleExitButtonClick() {
        this.handleConfigButtonClick();
        localStorage.setItem(lstorageKey.config, JSON.stringify(this.state.configSettings));
    }

    handleRecognitionResult(text: string) {
        let currItem = this.state.items[this.state.currItemIndex];
        let result = compareResult(GetSpeechItem(currItem).en, text);
        let koeff = result.missingWcount / result.totalWCount;
        if (koeff < 0.25 || result.command != VoiceCommand.NoCommand) {
            this.setState({ SRecognitionCheckPassed: true, lastRecognitionResult: result });
        } else {
            this.setState({ lastRecognitionResult: result });
        }
    }

    handleStartButtonClick() {
        this.setState({ isStarted: !this.state.isStarted }, () => {
            if (this.state.isStarted) {
                if (this.state.items[0].hasOwnProperty("p1")) {
                    this.startPlayDialogue();
                } else {
                    this.startPlaySpeech();
                }
            }
        });
    }

    async startPlayDialogue() {
        for (let i: number = 0; i < this.state.items.length;) {
            await this.waitStateApplying(
                {
                    currItemIndex: i,
                    SRecognitionCheckPassed: false,
                    SRecognizerCommand: SRCommand.Stop,
                });
            let currItem = this.state.items[i] as IDialogueItem;
            if (this.state.isStarted && this.state.configSettings.enEnabled) {
                await this.playSayButton(langEnum.enUs, currItem.p1.en);
            }
            if (this.state.isStarted) {
                this.waitStateApplying({ items: currItem.p2 });
                await this.startPlaySpeech();
            }
            if (!this.state.isStarted) {
                break;
            }
            await this.sayRecognitionResult();
            if (this.state.MoveNextItemAutomatically) {
                i++;
            }
        }
        this.setState({ isStarted: false });
    }

    async startPlaySpeech() {
        for (let i: number = 0; i < this.state.items.length;) {
            if (!this.state.lastRecognitionResult || this.state.lastRecognitionResult.command != VoiceCommand.ClearListenResultAndListenAgain) {
                await this.waitStateApplying(
                    {
                        currItemIndex: i,
                        SRecognitionCheckPassed: false,
                        SRecognizerCommand: SRCommand.Stop,
                    });
                let currItem = this.state.items[i];
                let currSpeechItem = GetSpeechItem(currItem);
                if (this.state.isStarted && this.state.configSettings.mp3Enabled && this.state.file && currSpeechItem.startTime && currSpeechItem.endTime) {
                    await this.playMP3Fragment(currSpeechItem.startTime, currSpeechItem.endTime);
                }
                if (this.state.isStarted && this.state.configSettings.enEnabled) {
                    await this.playSayButton(langEnum.enUs, currSpeechItem.en);
                }
                if (this.state.isStarted && this.state.configSettings.ruEnabled && currSpeechItem.ru) {
                    await this.playSayButton(langEnum.ruRu, currSpeechItem.ru);
                }
            } else {
                this.state.lastRecognitionResult.command = VoiceCommand.NoCommand;
            }

            if (!this.state.isStarted) {
                break;
            }

            await this.listenAndRecognizeVoiceAnswer();
            if (this.state.lastRecognitionResult && this.state.lastRecognitionResult.command) {
                if (this.state.lastRecognitionResult.command == VoiceCommand.ClearListenResultAndListenAgain) {
                    await this.waitStateApplying(
                        {
                            SRecognitionCheckPassed: false,
                            SRecognizerCommand: SRCommand.Stop,
                        });                    
                    continue;
                }
                if (this.state.lastRecognitionResult.command == VoiceCommand.GoNextItem) {
                    this.state.lastRecognitionResult.command = VoiceCommand.NoCommand;
                    i++;
                    continue;
                }
                this.state.lastRecognitionResult.command = VoiceCommand.NoCommand;
            }
            await this.sayRecognitionResult();
            if (this.state.MoveNextItemAutomatically) {
                i++;
            }
        }
        this.setState({ isStarted: false });
    }

    async waitStateApplying(newState: any) {
        let completed = false;
        this.setState(newState, () => { completed = true; });
        await waitWhile(() => !completed, `wait new state applying: ${JSON.stringify(newState)}`);
        console.log("New state applied");
    }

    async playMP3Fragment(startTim: number, endTim: number) {
        if (!this.state.configSettings.mp3Enabled || this.state.isPaused) {
            return;
        }
        await this.waitStateApplying({ startTime: startTim, endTime: endTim, isMP3Playing: true });
        if (this.aref.current && this.state.file) {
            this.aref.current.currentTime = this.state.startTime;
            this.aref.current.play();
            await waitWhile(() => this.state.isMP3Playing === true, "wait state.isMP3Playing=false");
        }
    }


    async playSayButton(lng: langEnum, textToSay: string) {
        if (this.state.isPaused) {
            await waitWhile(() => this.state.isPaused, "EN wait switching 'Pause' mode to 'Start'");
        }
        this.setState({ lang: lng, sayText: textToSay, isSayBtnPlaying: true });
        await waitWhile(() => this.state.isSayBtnPlaying === false, `${lng} wait applying new text=${textToSay}`);
        if (this.sayBtnWrapperRef.current) {
            this.sayBtnWrapperRef.current.getElementsByTagName("button")[0].click();
        }
        await waitWhile(() => this.state.isSayBtnPlaying === true, `${lng} wait completing the speech`);
    }

    async listenAndRecognizeVoiceAnswer() {
        this.setState({ SRecognizerCommand: SRCommand.Start });
        await waitWhileWithTimeout(
            this.state.configSettings.pause * 100,
            () => !this.state.SRecognitionCheckPassed,
            "Wait recognition check");
        this.setState({ SRecognizerCommand: SRCommand.Stop });
    }

    async sayRecognitionResult() {
        if (!this.state.lastRecognitionResult) {
            return;
        }
        await this.playSayButton(this.state.lastRecognitionResult.evaluationTextLanguage, this.state.lastRecognitionResult.evaluationText);
        this.setState({ lastRecognitionResult: undefined });
    }

    renderLoadFile() {
        return (
            <div className="load-file-page">
                <div className='app-version'>Version: 1.0.3</div>
                <label >
                    <input type="file" onChange={(e: any) => {
                        let f = e.currentTarget?.files[0];
                        this.loadFile(f);
                    }}>
                    </input>
                    <div className="img32Icondiv img-open-folder">

                    </div>
                </label>
            </div>
        );
    }


    renderConfigPane() {
        let mp3ButtonClassStr = (this.state.configSettings.mp3Enabled ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled");
        let enButtonClassStr = (this.state.configSettings.enEnabled ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled");
        let ruButtonClassStr = (this.state.configSettings.ruEnabled ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled");
        let updateConfig = (updProps: any) => {
            let newConfig = { ...this.state.configSettings, ...updProps };
            this.setState({ configSettings: newConfig });
        };
        return (
            <div className="splayer-page">
                <button className="toolbar-button " style={{ marginBottom: "10px" }} onClick={() => {
                    this.handleExitButtonClick();
                }}>
                    <div className="img-exit" />
                </button>
                <div className="splayer-page__toolbar">
                    <button className={mp3ButtonClassStr} onClick={() => {
                        updateConfig({ mp3Enabled: !this.state.configSettings.mp3Enabled });
                    }}>MP3</button>
                    <button className={enButtonClassStr} onClick={() => {
                        updateConfig({ enEnabled: !this.state.configSettings.enEnabled });
                    }}>EN</button>
                    <button className={ruButtonClassStr} onClick={() => {
                        updateConfig({ ruEnabled: !this.state.configSettings.ruEnabled });
                    }}>RU</button>
                    <PauseTuner parent={this} />
                </div>
            </div>
        );
    }

    renderSRecognizer() {
        return (
            <div className="srecognizer-container">
                <SRecognizer parent={this} onChange={(text: string) => {
                    this.handleRecognitionResult(text);
                }} />
            </div>
        )
    }


    renderMainPane() {
        let startButtonClassStr = (this.state.isStarted ? "toolbar-button toolbar-button__enabled" : "toolbar-button toolbar-button__disabled");
        let pauseButtonClassStr = (this.state.isPaused ? "img-play" : "img-pause");
        let moveNextItemClassStr = (this.state.MoveNextItemAutomatically ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled");

        return (
            <div className="splayer-page">
                <div className="splayer-page__toolbar">
                    <button className={startButtonClassStr} onClick={() => {
                        this.handleStartButtonClick();
                    }}><div className="img-power-on" />
                    </button>
                    <button className='toolbar-button' onClick={() => {
                        this.handlePauseButtonClick();
                    }}><div className={pauseButtonClassStr} /></button>
                    <button className={moveNextItemClassStr} onClick={() => {
                        this.setState({ MoveNextItemAutomatically: !this.state.MoveNextItemAutomatically });
                    }}>next</button>
                    <button className={"toolbar-button"} onClick={() => {
                        this.handleConfigButtonClick();
                    }}><div className="img-config" />
                    </button>
                </div>

                <audio ref={this.aref} src={this.state.url} loop={true} onTimeUpdate={(e) => {
                    if (this.aref.current) {
                        if (this.aref.current.currentTime > this.state.endTime) {
                            this.setState({ isMP3Playing: false })
                            this.aref.current.pause();
                        }
                    }
                }}
                />
                <div ref={this.sayBtnWrapperRef} id="SayButtonWrapper" style={{ display: "none" }}>
                    <SayButton
                        voice={this.langSelector}
                        text={this.state.sayText}
                        onEnd={() => {
                            this.setState({ isSayBtnPlaying: false })
                        }}
                    />
                </div>
                <div className="splayer_page__text">{this.state.sayText}</div>
                {this.renderSRecognizer()}
            </div>
        );
    }

    render(): React.ReactNode {
        if (!this.state.file && this.state.items.length == 0) {
            return this.renderLoadFile();
        }
        if (this.state.configPaneVisibility) {
            return this.renderConfigPane();
        }
        return this.renderMainPane();
    }
}