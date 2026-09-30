
import { workerData}  from 'worker_threads';
import fs from 'node:fs'
import {Buffer} from 'node:buffer';

import {WirthMarkovFSM} from "../parser/wirth_markov_fsm.js"
//console.log('init with', workerData);


const sab = workerData.sab;
const auxData = workerData.auxData;


const cassetteState  = new Int32Array(auxData, 0, 1);
const state = new Int32Array(auxData, 4, 1);
const data  = new Uint8Array(auxData, 8, 4084);
const filenameLength  = new Uint8Array(auxData, 4084, 2 );
const filename  = new Uint8Array(auxData, 4096 );

const view = new Uint8Array(sab);       // один раз
const buf = Buffer.from(view.buffer, view.byteOffset, view.byteLength)

const fileName =  "/home/kshakirov/Documents/resources/test.csv";
//this is a start message with thef filename

const WORKER_TURN= 0,
      MAIN_TURN =1,
      DESTROYED=2;


Atomics.wait(cassetteState, 0, MAIN_TURN);
Atomics.store(cassetteState,0,WORKER_TURN);
Atomics.notify(cassetteState);
const i32 = new Int32Array(auxData, 4084, 2);
const length = i32[0];

let recievedFilename = Buffer.from(auxData, 4096, length);


const fd = fs.openSync(recievedFilename, 'r'),
      chunk_size = 8192,
      bufferSize = 64 * 1024;
const mod = (a, b) => ((a % b) + b) % b;

let i =0;
let readBytes;
let bufferIndex = 0,
    itable = new Int32Array(4096),
    itableIndex =0,
    parserState = 5;
while ((readBytes =  fs.readSync(fd,buf,mod(i*chunk_size,bufferSize) , chunk_size )) >0){
    if(bufferIndex >= bufferSize){
	bufferIndex = 0;
    }
    console.log(`Before Wirht: bi ${bufferIndex} ti ${itableIndex} bufferSize ${bufferSize}`)
    console.log(`Worker: read Bytes ${readBytes}`);
    [parserState,bufferIndex,itable, itableIndex] =  WirthMarkovFSM(buf, bufferIndex,itable, itableIndex, parserState );
    console.log(`parserState ${parserState}, bufferIndex ${bufferIndex}, itable, itableIndex ${itableIndex}`);
    console.log(itable.slice(0,10));
    console.log(itable.slice(itableIndex - 5,itableIndex));
    console.log(bufferIndex);
    console.log(itableIndex);
    Atomics.store(cassetteState, 0,MAIN_TURN);
    Atomics.notify(cassetteState);

    


    i+=1;
    Atomics.wait(cassetteState,0, MAIN_TURN);
//    bufferIndex = mod(bufferIndex + readBytes, bufferSize);
    itableIndex=0;

}

Atomics.store(cassetteState, 0,DESTROYED);
console.log(`Worker:Breaking read Bytes ${readBytes}`);
Atomics.notify(cassetteState);




console.log("All done");







