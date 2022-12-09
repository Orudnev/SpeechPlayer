import React, { createRef } from 'react';
import JSZip from 'jszip';
interface ISPlayerState{
    file?:File
    url?:string,
    startTime:number,
    endTime:number
}

const binToStringConverter = new FileReader();


export class SPlayer extends React.PureComponent<any,ISPlayerState> {
    aref:React.RefObject<HTMLAudioElement>;
    constructor(props:any){
        super(props);
        this.state={
            file:undefined,
            url:undefined,
            startTime:10,
            endTime:15
        }
        this.aref = createRef();
        this.onBinConverted = this.onBinConverted.bind(this);
    }

    componentDidMount(): void {
        binToStringConverter.addEventListener("loadend",this.onBinConverted);
    }

    componentWillUnmount(): void {
        binToStringConverter.removeEventListener("loadend",this.onBinConverted);
    }

    onBinConverted(e:any){
        let strResult = e.srcElement.result;
    }

    loadFile(selFile:File){
        JSZip.loadAsync(selFile as Blob)
        .then((zip)=>{
            zip.files["localization.ts"].async('blob').then((res:any) =>{
                binToStringConverter.readAsText(res);
            });
            zip.files["mp3test.mp3"].async('blob').then((res:any) =>{
                this.setState({ file: res, url: URL.createObjectURL(res as Blob) })
            });
        })

        // this.setState({ file: selFile, url: URL.createObjectURL(selFile as Blob) })
    }

    renderLoadFile(){
        return (
            <input type="file" onChange={(e:any)=>{
                let f = e.currentTarget?.files[0];
                this.loadFile(f);
            }}>                
            </input>
        );
    }
 
    render(): React.ReactNode {
        if(!this.state.file){
            return this.renderLoadFile();
        }
        return(
            <div>
                <button onClick={()=>{
                    if (this.aref.current){
                        this.aref.current.currentTime = this.state.startTime;
                        this.aref.current.play();    
                    }
                }}>play</button>
                <audio ref={this.aref} src={this.state.url} loop={true} onTimeUpdate={(e)=>{
                if(this.aref.current){
                    if(this.aref.current.currentTime>this.state.endTime){
                        this.aref.current.pause();
                    }
                }
           }} />                
            </div>
        );
    }
}