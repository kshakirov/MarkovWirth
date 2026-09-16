

import { parentPort, workerData}  from 'worker_threads';
import {syncParseFile} from  "./file_reader.js";
import {Buffer} from 'node:buffer';
console.log('init with', workerData);


const sab = new SharedArrayBuffer(64*1024);
const view = new Uint8Array(sab);       // один раз
const buf = Buffer.from(view.buffer, view.byteOffset, view.byteLength)
//const buf = Buffer.alloc(64*1024);

function notifyMainProcess(num){
    parentPort.postMessage({ type: 'readBytes', value: num });
}



parentPort.on('message', (msg) => {
    parentPort.postMessage({ echo: msg });
    syncParseFile(buf, msg.fileName, notifyMainProcess);
});
