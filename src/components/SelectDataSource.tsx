import React, { FunctionComponent } from 'react';
import {AppAction, dispatchFunc,ActAsyncReadZipFile} from '../AppData';


interface ISelectDataSourceProps {
    dispatch:dispatchFunc;
}
export const SelectDataSource: FunctionComponent<ISelectDataSourceProps> = (props) => {
    return (
        <div className="load-file-page">
            <div className='app-version'>Version: 1.0.5</div>
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