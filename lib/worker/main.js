import { Worker } from 'worker_threads';

const sab = new SharedArrayBuffer(64*1024),
      auxData = new SharedArrayBuffer(8192);


const cassetteState  = new Int32Array(auxData, 0, 1);
const dataOffset = new Int32Array(auxData, 4, 1);
const dataLength = new Int32Array(auxData, 8, 1);
const indexTapeOffset = new Int32Array(auxData, 12, 1);
const indexTapeLength = new Int32Array(auxData, 16, 1);
const data  = new Uint8Array(auxData, 20, 4084 - 20);
const filenameLength  = new Uint8Array(auxData, 4084, 2 );
const filename  = new Uint8Array(auxData, 4096 );

const MAIN_TURN= 1,
      WORKER_TURN =0,
      DESTROYED=2;

const w = new Worker('./lib/worker/worker.js', { workerData: { sab, auxData }});

const fileName = "/home/kshakirov/Documents/resources/test.csv";

const fileNameBytes = Buffer.from(fileName, 'utf8');

Atomics.store(cassetteState,0,MAIN_TURN);
filename.set(fileNameBytes.subarray(0,4096));
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
    }

   // console.log("at last");
     
    Atomics.store(cassetteState,0, WORKER_TURN);
    Atomics.notify(cassetteState);
	

}


