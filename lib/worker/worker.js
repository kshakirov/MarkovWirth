
import { workerData}  from 'worker_threads';
import fs from 'node:fs'
import {Buffer} from 'node:buffer';

import {WirthMarkovFSM} from "../parser/wirth_markov_fsm.js"
import {
    CASSETTE_STATE_OFFSET,
    DATA_BUFFER_CAPACITY,
    DATA_LENGTH_OFFSET,
    DATA_OFFSET_OFFSET,
    DESTROYED,
    FILENAME_CAPACITY,
    FILENAME_LENGTH_CAPACITY,
    FILENAME_LENGTH_OFFSET,
    FILENAME_OFFSET,
    INDEX_TAPE_CAPACITY,
    INDEX_TAPE_LENGTH_OFFSET,
    INDEX_TAPE_OFFSET,
    INDEX_TAPE_OFFSET_OFFSET,
    MAIN_TURN,
    READ_CHUNK_SIZE,
    WORKER_TURN,
} from './shared_layout.js';
//console.log('init with', workerData);
const sab = workerData.sab;
const auxData = workerData.auxData;


const cassetteState  = new Int32Array(auxData, CASSETTE_STATE_OFFSET, 1);
const dataOffset = new Int32Array(auxData, DATA_OFFSET_OFFSET, 1);
const dataLength = new Int32Array(auxData, DATA_LENGTH_OFFSET, 1);
const indexTapeOffset = new Int32Array(auxData, INDEX_TAPE_OFFSET_OFFSET, 1);
const indexTapeLength = new Int32Array(auxData, INDEX_TAPE_LENGTH_OFFSET, 1);
const filenameLength = new Uint8Array(auxData, FILENAME_LENGTH_OFFSET, FILENAME_LENGTH_CAPACITY);
const filename = new Uint8Array(auxData, FILENAME_OFFSET, FILENAME_CAPACITY);
let indexTape = new Int32Array(
      auxData,
      INDEX_TAPE_OFFSET,
      INDEX_TAPE_CAPACITY
  );

const view = new Uint8Array(sab);       // один раз
const buf = Buffer.from(view.buffer, view.byteOffset, view.byteLength)

Atomics.wait(cassetteState, 0, MAIN_TURN);
Atomics.store(cassetteState,0,WORKER_TURN);
Atomics.notify(cassetteState);

const length = filenameLength[0];
const recievedFilename = filename.subarray(0, length);


const fd = fs.openSync(recievedFilename, 'r'),
      chunk_size = READ_CHUNK_SIZE,
      bufferSize = DATA_BUFFER_CAPACITY;
const mod = (a, b) => ((a % b) + b) % b;


let i =0;
let readBytes;
let readBytesAcc=0;
let bufferIndex = 0,
    itableLength = INDEX_TAPE_CAPACITY,
    itableIndex =0,
    parserState = 5;
while ((readBytes =  fs.readSync(fd,buf,mod(readBytesAcc,bufferSize) , chunk_size )) >0){
    const liveLength = readBytesAcc + readBytes;

    [parserState,bufferIndex,indexTape, itableIndex] =  WirthMarkovFSM(buf.subarray(0, liveLength), bufferIndex,indexTape, itableIndex, parserState );
    console.log(`parserState ${parserState}, bufferIndex ${bufferIndex}, itable, itableIndex ${itableIndex}`);
    readBytesAcc += readBytes;
    let bufferIsDone=false,itableIsDone=false;
    if((bufferIsDone = (bufferSize - readBytesAcc < chunk_size)) || (itableIsDone = (itableLength - itableIndex < chunk_size))){
	if(bufferIsDone){
	    console.log("Buffer is done changing" + bufferIsDone);
//	    dataOffset[0] = bufferIndex; this one is preserved got from previous time
	    dataLength[0] = bufferIndex - dataOffset[0];
	    if(itableLength - itableIndex < chunk_size){
		console.log("Both are done changing   " + itableIsDone );
//		indexTapeOffset[0] = 0; the same from previous time
		indexTapeLength[0] = itableIndex - indexTapeOffset[0];
		Atomics.store(cassetteState, 0,MAIN_TURN);
		Atomics.notify(cassetteState);
		Atomics.wait(cassetteState,0, MAIN_TURN);
		dataOffset[0] = 0;
		dataLength[0] = 0;
		indexTapeOffset[0] = 0;
		indexTapeLength[0] = 0;
		itableIndex=0;
 		readBytesAcc = 0;
		bufferIndex = 0;
		i+=1;
	    }else{
		console.log("but Table is not");
		//indexTapeOffset[0] = 0; the previous one 
		indexTapeLength[0] = itableIndex - indexTapeOffset[0];
		Atomics.store(cassetteState, 0,MAIN_TURN);
		Atomics.notify(cassetteState);
		Atomics.wait(cassetteState,0, MAIN_TURN);
		indexTapeOffset[0] = itableIndex;
		indexTapeLength[0] = 0;
		dataOffset[0] = 0;
		dataLength[0] = 0;
		readBytesAcc = 0;
		bufferIndex = 0;


		i+=1;
		

	    }
	}else if(itableIsDone){
	    console.log("Table is done changing");
//	    indexTapeOffset[0] = 0;
	    indexTapeLength[0] = itableIndex - indexTapeOffset[0];
	  //  dataOffset[0] = bufferIndex;
	    dataLength[0] = bufferIndex - dataOffset[0];
	    Atomics.store(cassetteState, 0,MAIN_TURN);
	    Atomics.notify(cassetteState);
	    Atomics.wait(cassetteState,0, MAIN_TURN);
	    dataOffset[0]= bufferIndex;
	    dataLength[0] = 0;
	    indexTapeOffset[0] = 0;
	    indexTapeLength[0] = 0;
	    itableIndex=0;
	    i+=1;

	}
    }

    
    i+=1;




}

dataOffset[0] = bufferIndex;
dataLength[0] = bufferIndex - dataOffset[0];
indexTapeOffset[0] = itableIndex;
indexTapeLength[0] = itableIndex - indexTapeOffset[0];

Atomics.store(cassetteState, 0,DESTROYED);
console.log(`Worker:Breaking read Bytes ${readBytes}`);
Atomics.notify(cassetteState);




console.log("All done");






