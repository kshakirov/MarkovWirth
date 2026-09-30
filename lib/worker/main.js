import { Worker } from 'worker_threads';

const sab = new SharedArrayBuffer(64*1024),
      auxData = new SharedArrayBuffer(8192);


const mutex  = new Int32Array(auxData, 0, 1);
const state = new Int32Array(auxData, 4, 1);
const data  = new Uint8Array(auxData, 8, 4084);
const filenameLength  = new Uint8Array(auxData, 4084, 2 );
const filename  = new Uint8Array(auxData, 4096 );

const LOCK= 1,
      UNLOCK =0,
      DESTROYED=2;

const w = new Worker('./lib/worker/worker.js', { workerData: { sab, auxData }});

const fileName = "/home/kshakirov/Documents/resources/test.csv";

const fileNameBytes = Buffer.from(fileName, 'utf8');

Atomics.store(mutex,0,LOCK);
filename.set(fileNameBytes.subarray(0,4096));
filenameLength[0] = fileNameBytes.length & 0xff;
filenameLength[1] = (fileNameBytes.length >> 8) & 0xff;

Atomics.store(mutex,0,UNLOCK);
Atomics.notify(mutex);

for (;;){
    
    const res = Atomics.waitAsync(mutex, 0, UNLOCK);
    if (res.async) await res.value;
    const mutex_state = Atomics.load(mutex, 0);
    if(mutex_state == DESTROYED){
	console.log("Exiting ..")
	break;
    }else{
	//console.log(`Not exiting yet stop is ${stop}`)
    }

   // console.log("at last");
     
    Atomics.store(mutex,0, UNLOCK);
    Atomics.notify(mutex);
	

}


