import React, { FunctionComponent,useState } from 'react';
import {AppAction, DispatchFunc,ActAsyncReadZipFile} from '../AppData';



interface ISelectDataSourceProps {
    dispatch:DispatchFunc;
}
export const SelectDataSource: FunctionComponent<ISelectDataSourceProps> = (props) => {
    return (
        <div className="load-file-page">
            <div className='app-version'>Version: 3.0.1</div>
            <label >
                <input type="file" onChange={(e: any) => {
                    let f = e.currentTarget?.files[0];
                    ActAsyncReadZipFile(props.dispatch,f);
                }}>
                </input>
                <div className="img32Icondiv img-open-folder">

                </div>
            </label>
        </div>
    );
};


