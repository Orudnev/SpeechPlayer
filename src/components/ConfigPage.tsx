import React, { FunctionComponent, useState } from 'react';
import { AppGlobal} from '../App';
import { TLang,TLRuid,ILocMessage,ConfigSettings,RoutePath } from '../AppData';


interface ISliderProps {
    caption: string;
    value:number;
    onChange:(value:number)=>void;
}
const SliderComp = (props: ISliderProps) => {
    return (
        <div className='slider'>
            <div className='caption'>{props.caption}</div>
            <div className='value'>{props.value.toFixed(1)}</div>
            <input type="range" min="0.5" max="30" step="0.5" value={props.value} onChange={(e) => {
                props.onChange(parseFloat(e.target.value));
            }} />
            <hr />
        </div>
    );
}

interface ICheckBoxProps {
    checked:boolean;
    caption:string;
    onChange:()=>void;
}
const CheckBox = (props:ICheckBoxProps)=>{
    return (
        <div className='checkbox'  >
            <div className='caption'>{props.caption}</div>
            <input type='checkbox' checked={props.checked} onChange={()=>props.onChange()}/>
        </div>
    );
}

interface ISelLangProps {
    lang:TLang;
    onChange:()=>void;
}
const SelLang = (props:ISelLangProps)=>{
    return (
        <div className='sel-lang' >
            <div className='caption'>{getLr('lang',props.lang)}</div>
            <div className='rb-div'>
                <label>EN</label>
                <input type='radio' name="selLang" checked={props.lang=='EN'} onChange={()=>props.onChange()} />
                <div className='rb-space'></div>
                <label>RU</label>
                <input type='radio' name="selLang" checked={props.lang=='RU'} onChange={()=>props.onChange()} />
            </div>
        </div>
    );
}



const messages:ILocMessage[] = [
    {uid:'lang',en:"Language",ru:"Язык"},
    {uid:'enableSR',en:"Speech recognition",ru:"Распознавание речи"},
    {uid:'srDurationPerWord',en:"Duration of answer listening (second / each word of answer)",ru:"Длительность ожидания прослушивания ответа (секунд / на каждое слово ответа )"},
]

function getLr(uid:TLRuid,lang:TLang):string{
    const res = messages.find(itm=>itm.uid === uid);
    if (res){
        return (lang==="EN"?res.en:res.ru);
    }
    return "";
}
 

export const ConfigPage = () => {
    const [lang,setLang] = useState(ConfigSettings.prop('dlgLanguage') as TLang);
    const [useSR,setUseSR] = useState(ConfigSettings.prop('dlgEnableSR') as boolean);
    const [wrdDuration,setWrdDuration] = useState(ConfigSettings.prop('dlgSrDuration') as number);
    const handleExitButtonClick = ()=>{
        ConfigSettings.prop('dlgLanguage',lang);
        ConfigSettings.prop('dlgEnableSR',useSR);
        ConfigSettings.prop('dlgSrDuration',wrdDuration);
        AppGlobal.navigate(RoutePath.dialog);
    }
    return (
        <div className='config-page'>
            <button className="toolbar-button " style={{ marginBottom: "10px" }} onClick={() => {
                handleExitButtonClick();
            }}>
                <div className="img-exit" />
            </button>
            <hr />
            <SelLang lang={lang} onChange = {()=>{
                if(lang == 'EN'){
                    setLang('RU');
                } else {
                    setLang('EN');
                }
            }}/>
            <hr />
            <CheckBox checked={useSR} onChange={()=>setUseSR(!useSR)} caption={getLr('enableSR',lang)} />
            <hr />
            {useSR && <SliderComp caption={getLr('srDurationPerWord',lang)} value={wrdDuration} onChange={(newVal)=>setWrdDuration(newVal)} />}
        </div>
    );
}

