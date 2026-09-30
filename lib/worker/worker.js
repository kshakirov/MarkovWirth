
import { workerData}  from 'worker_threads';
import fs from 'node:fs'
import {Buffer} from 'node:buffer';

import {WirthMarkovFSM} from "../parser/wirth_markov_fsm.js"
//console.log('init with', workerData);


const sab = workerData.sab;
const auxData = workerData.auxData;


const cassetteState  = new Int32Array(auxData, 0, 1);
const dataOffset = new Int32Array(auxData, 4, 1);
const dataLength = new Int32Array(auxData, 8, 1);
const indexTapeOffset = new Int32Array(auxData, 12, 1);
const indexTapeLength = new Int32Array(auxData, 16, 1);
const data  = new Uint8Array(auxData, 20, 4084 - 20);
const filenameLength  = new Uint8Array(auxData, 4084, 2 );
const filename  = new Uint8Array(auxData, 4096 );

const view = new Uint8Array(sab);       // один раз
const buf = Buffer.from(view.buffer, view.byteOffset, view.byteLength)

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
let ITABLE_START_FOR_MAIN=0,
    BUFFER_START_FOR_MAIN=0;
let i =0;
let readBytes;
let readBytesAcc=0;
let bufferIndex = 0,
    itable = new Int32Array(4096),
    itableLength = itable.length,
    itableIndex =0,
    parserState = 5;
while ((readBytes =  fs.readSync(fd,buf,mod(readBytesAcc,bufferSize) , chunk_size )) >0){

    console.log(`Before Wirht: bi ${bufferIndex} ti ${itableIndex} bufferSize ${bufferSize}`)
    console.log(`Worker: read Bytes ${readBytes}`);
    [parserState,bufferIndex,itable, itableIndex] =  WirthMarkovFSM(buf, bufferIndex,itable, itableIndex, parserState );
    console.log(`parserState ${parserState}, bufferIndex ${bufferIndex}, itable, itableIndex ${itableIndex}`);
    readBytesAcc += readBytes;
    console.log(itable.slice(0,10));
    console.log(itable.slice(itableIndex - 5,itableIndex));
    console.log(bufferIndex);
    console.log(itableIndex);
    let bufferIsDone=false,itableIsDone=false;
    if((bufferIsDone = (bufferSize - readBytesAcc < chunk_size)) || (itableIsDone = (itableLength - itableIndex < chunk_size))){
	if(bufferIsDone){
	    console.log("Buffer is done changing" + bufferIsDone);
	    dataOffset[0] = 0;
	    dataLength[0] = readBytesAcc;
	    BUFFER_START_FOR_MAIN =0;
	    if(itableLength - itableIndex < chunk_size){
		console.log("Both are done changing   " + itableIsDone );
		indexTapeOffset[0] = 0;
		indexTapeLength[0] = itableIndex;
		ITABLE_START_FOR_MAIN = 0;
		

	    }else{
		ITABLE_START_FOR_MAIN = indexTapeOffset;
	    }
	}else if(itableIsDone){
	    console.log("Table is done changing");
	    indexTapeOffset[0] = 0;
	    indexTapeLength[0] = itableIndex;
	    ITABLE_START_FOR_MAIN = 0;
	    BUFFER_START_FOR_MAIN = bufferIndex;

	}
	
    }
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







