import { Worker } from 'worker_threads';

const sab = new SharedArrayBuffer(64*1024),
      auxData = new SharedArrayBuffer(8192);


const head  = new Int32Array(auxData, 0, 1);
const state = new Int32Array(auxData, 4, 1);
const data  = new Uint8Array(auxData, 8, 4084);
const filenameLength  = new Uint8Array(auxData, 4084, 2 );
const filename  = new Uint8Array(auxData, 4096 );




const w = new Worker('./lib/worker/worker.js', { workerData: { sab, auxData }});

const fileName = "/home/kshakirov/Documents/resources/london_crime_by_lsoa_short_1.csv";

const fileNameBytes = Buffer.from(fileName, 'utf8');

Atomics.store(head,0,1);
filename.set(fileNameBytes.subarray(0,4096));
filenameLength[0] = fileNameBytes.length & 0xff;
filenameLength[1] = (fileNameBytes.length >> 8) & 0xff;

Atomics.store(head,0,0);
Atomics.notify(head);

for (;;){
    
    const res = Atomics.waitAsync(head, 0, 0);
    if (res.async) await res.value;
    const stop = Atomics.load(head, 0);
    if(stop == 2){
	console.log("Exiting ..")
	break;
    }else{
	//console.log(`Not exiting yet stop is ${stop}`)
    }

   // console.log("at last");
     
    Atomics.store(head,0, 0);
    Atomics.notify(head);
	

}


