import { Worker } from 'worker_threads';
import {
    AUX_DATA_CAPACITY,
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
    WORKER_TURN,
} from './shared_layout.js';

const auxData = new SharedArrayBuffer(AUX_DATA_CAPACITY);
const sab = new SharedArrayBuffer(DATA_BUFFER_CAPACITY);
const cassetteState  = new Int32Array(auxData, CASSETTE_STATE_OFFSET, 1);
const dataOffset = new Int32Array(auxData, DATA_OFFSET_OFFSET, 1);
const dataLength = new Int32Array(auxData, DATA_LENGTH_OFFSET, 1);
const indexTapeOffset = new Int32Array(auxData, INDEX_TAPE_OFFSET_OFFSET, 1);
const indexTapeLength = new Int32Array(auxData, INDEX_TAPE_LENGTH_OFFSET, 1);
const filenameLength = new Uint8Array(auxData, FILENAME_LENGTH_OFFSET, FILENAME_LENGTH_CAPACITY);
const filename = new Uint8Array(auxData, FILENAME_OFFSET, FILENAME_CAPACITY);
const indexTape = new Int32Array(
      auxData,
      INDEX_TAPE_OFFSET,
      INDEX_TAPE_CAPACITY
  );

const w = new Worker('./lib/worker/worker.js', { workerData: { sab, auxData }});

const fileName = "/home/kshakirov/Documents/resources/test.csv";

const fileNameBytes = Buffer.from(fileName, 'utf8');

Atomics.store(cassetteState,0,MAIN_TURN);
filename.set(fileNameBytes.subarray(0, filename.length));
filenameLength[0] = fileNameBytes.length & 0xff;
filenameLength[1] = (fileNameBytes.length >> 8) & 0xff;

Atomics.store(cassetteState,0,WORKER_TURN);
Atomics.notify(cassetteState);

for (;;){
    
    const res = Atomics.waitAsync(cassetteState, 0, WORKER_TURN);
    if (res.async) await res.value;
    const cassette_state = Atomics.load(cassetteState, 0);
    if(cassette_state == DESTROYED){
	console.log("Exiting ..")
	break;
    }else{
	//console.log(`Not exiting yet stop is ${stop}`)
//	console.log(indexTapeOffset, indexTapeLength);
	console.log(indexTape.slice(indexTapeOffset[0],5));
	console.log(indexTape.slice(indexTapeOffset[0] + indexTapeLength  - 5,indexTapeOffset[0] + indexTapeLength));
	console.log("#############################################################")
    }

   // console.log("at last");
     
    Atomics.store(cassetteState,0, WORKER_TURN);
    Atomics.notify(cassetteState);
	

}

