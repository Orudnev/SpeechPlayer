import React, { createRef, useState } from 'react';
import JSZip from 'jszip';
//@ts-ignore
import { SayButton } from 'react-say';
import { waitFor } from '@testing-library/react';

enum langEnum {
    enUs = "en-US",
    ruRu = "ru=RU"
}

interface ISPlayerState {
    file?: File
    url?: string,
    startTime: number,
    endTime: number,
    isMP3Playing: boolean,
    isSayBtnPlaying: boolean,
    lang: langEnum,
    sayText: string,
    isPaused: boolean;
    mp3Enabled: boolean;
    enEnabled: boolean;
    ruEnabled: boolean;
    pause: number;
    MoveNextItemAutomatically:boolean;
    items: any[]
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
    async function wait(ms = 100) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        });
    }
    async function waitWhile(conditionFunc: () => boolean) {
        while (conditionFunc()) {
            await wait();
        }
    }
    const handleMouseDown = (e: any) => {
        changePauseValue(e);
    };

    const changePauseValue = (e: any) => {
        let elmRect = e.target.getBoundingClientRect();
        let middleX = elmRect.left + elmRect.width / 2;
        let state = props.parent.state;
        let touchX = e.touches[0].clientX;
        if (touchX > middleX) {
            //right button clicked
            props.parent.setState({ pause: state.pause + 1 });
        } else {
            //left button clicked
            props.parent.setState({ pause: state.pause - 1 });
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
            <div id="value">{props.parent.state.pause}</div>
        </div>
    );
}

export class SPlayer extends React.Component<any, ISPlayerState> {
    aref: React.RefObject<HTMLAudioElement>;
    sayBtnWrapperRef: React.RefObject<HTMLDivElement>;
    touchState: number = 0;
    constructor(props: any) {
        super(props);
        this.state = {
            file: undefined,
            url: undefined,
            isMP3Playing: false,
            isSayBtnPlaying: false,
            startTime: 10,
            endTime: 15,
            lang: langEnum.ruRu,
            sayText: "",
            isPaused: false,
            mp3Enabled: true,
            enEnabled: true,
            ruEnabled: true,
            pause: 50, //unit: 0.1 second 
            MoveNextItemAutomatically:true,
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
        let sitems = incomingJson.items.map((itm: any, index: number) => {
            return { id: index + 1, en: itm.en, ru: itm.ru, startTime: itm.startTime, endTime: itm.endTime };
        });
        this.setState({ items: sitems, lang: langEnum.enUs, sayText: sitems[0].en });
    }

    loadFile(selFile: File) {
        JSZip.loadAsync(selFile as Blob)
            .then((zip) => {
                zip.files["Introduction.json"].async('blob').then((res: any) => {
                    binToStringConverter.readAsText(res);
                });
                zip.files["Introduction.mp3"].async('blob').then((res: any) => {
                    this.setState({ file: res, url: URL.createObjectURL(res as Blob) })
                });
            })

        // this.setState({ file: selFile, url: URL.createObjectURL(selFile as Blob) })
    }

    handlePauseButtonClick() {
        this.setState({ isPaused: !this.state.isPaused });
    }

    async handleStartButtonClick() {
        async function wait(ms = 200) {
            return new Promise(resolve => {
                setTimeout(resolve, ms)
            });
        }
        async function waitWhile(conditionFunc: () => boolean) {
            while (conditionFunc()) {
                await wait();
            }
        }
        for (let i: number = 0; i < this.state.items.length; ) {
            let currItem = this.state.items[i];
            this.setState({ startTime: currItem.startTime, endTime: currItem.endTime, isMP3Playing: true, sayText: currItem.en }, () => {
                this.playMP3Fragment()
            });
            if (this.state.mp3Enabled) {
                await waitWhile(() => this.state.isMP3Playing === false); //wait state.isPlaying == true (MP3 fragment playing start)
                await waitWhile(() => this.state.isMP3Playing === true); //wait state.isPlaying == false (MP3 fragment playing end)
                await waitWhile(() => this.state.isPaused); //wait switching to this.state.isPaused == false   
            }

            if (this.state.enEnabled) {
                this.setState({ lang: langEnum.enUs, sayText: currItem.en, isSayBtnPlaying: true });
                await waitWhile(() => this.state.isSayBtnPlaying === false); //wait state.isSayBtnPlaying == true (Say button fragment playing start)            
                this.playSayButton();
                await waitWhile(() => this.state.isSayBtnPlaying === true); //wait state.isSayBtnPlaying == false (Say button fragment playing end)            
                await waitWhile(() => this.state.isPaused); //wait switching to this.state.isPaused == false    
            }

            if (this.state.ruEnabled) {
                this.setState({ lang: langEnum.ruRu, sayText: currItem.ru, isSayBtnPlaying: true });
                await waitWhile(() => this.state.isSayBtnPlaying === false); //wait state.isSayBtnPlaying == true (Say button fragment playing start)            
                this.playSayButton();
                await waitWhile(() => this.state.isSayBtnPlaying === true); //wait state.isSayBtnPlaying == false (Say button fragment playing end)  
                await waitWhile(() => this.state.isPaused); //wait switching to this.state.isPaused == false    
            }
            await wait(this.state.pause*100);
            if(this.state.MoveNextItemAutomatically){
                i++;
            }
        }
    }

    playMP3Fragment() {
        if (this.state.mp3Enabled) {
            if (this.aref.current) {
                this.aref.current.currentTime = this.state.startTime;
                this.aref.current.play();
            }
        }
    }


    playSayButton() {
        if (this.sayBtnWrapperRef.current) {
            this.sayBtnWrapperRef.current.getElementsByTagName("button")[0].click();
        }
    }

    renderLoadFile() {
        return (
            <div className="load-file-page">
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

    render(): React.ReactNode {
        if (!this.state.file) {
            return this.renderLoadFile();
        }
        let pauseButtonClassStr = (this.state.isPaused ? "img-play" : "img-pause");
        let mp3ButtonClassStr = (this.state.mp3Enabled ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled")
        let enButtonClassStr = (this.state.enEnabled ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled")
        let ruButtonClassStr = (this.state.ruEnabled ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled")
        let moveNextItemClassStr = (this.state.MoveNextItemAutomatically ? "toolbar-button toolbar-button__text toolbar-button__enabled" : "toolbar-button toolbar-button__text toolbar-button__disabled")
        return (
            <div className="splayer-page">
                <div className="splayer-page__toolbar">
                    <button className="toolbar-button" onClick={() => {
                        this.handleStartButtonClick();
                    }}><div className="img-power-on" />
                    </button>
                    <button className='toolbar-button' onClick={() => {
                        this.handlePauseButtonClick();
                    }}><div className={pauseButtonClassStr} /></button>
                    <button className={mp3ButtonClassStr} onClick={() => {
                        this.setState({ mp3Enabled: !this.state.mp3Enabled });
                    }}>MP3</button>
                    <button className={enButtonClassStr} onClick={() => {
                        this.setState({ enEnabled: !this.state.enEnabled });
                    }}>EN</button>
                    <button className={ruButtonClassStr} onClick={() => {
                        this.setState({ ruEnabled: !this.state.ruEnabled });
                    }}>RU</button>
                    <PauseTuner parent={this} />
                    <button className={moveNextItemClassStr} onClick={() => {
                        this.setState({ MoveNextItemAutomatically: !this.state.MoveNextItemAutomatically});
                    }}>next</button>

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
                        speak={this.state.sayText}
                        onEnd={() => {
                            this.setState({ isSayBtnPlaying: false })
                        }}
                    />
                </div>
                <div className="splayer_page__text">{this.state.sayText}</div>
            </div>
        );
    }
}