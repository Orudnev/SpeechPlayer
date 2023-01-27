export async function wait(ms = 200) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    });
}
export async function waitWhile(conditionFunc: () => boolean,message:string="") {
    while (conditionFunc()) {
        await wait();
        if(message){
            //console.log("witeWhile:",message);
        }
    }
}
export async function waitWhileWithTimeout(timeout_ms:number,conditionFunc: () => boolean,message:string="") {
    let msCounter = 0;
    while (conditionFunc() && msCounter<timeout_ms) {
        msCounter = msCounter + 200;
        await wait();
        if(message){
            //console.log("witeWhileWithTimeout:(",timeout_ms-msCounter,")   ",message);
        }
    }
}