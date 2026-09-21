import { Worker } from 'worker_threads';

const sab = new SharedArrayBuffer(64*1024),
      auxData = new SharedArrayBuffer(1024);


const head  = new Int32Array(auxData, 0, 1);
const state = new Int32Array(auxData, 4, 1);
const data  = new Uint8Array(auxData, 8);

const w = new Worker('./lib/worker/worker.js', { workerData: { sab, auxData }});

const fileName = "/home/kshakirov/Documents/resources/london_crime_by_lsoa_short_1.csv";

// Atomics.store(head);

// Atomics.store(head);
  
// Atomics.notify(head, 0);

for (;;){
    //    Atomics.waitAsync(head, 1).value.then(()=>{});




    
    const res = Atomics.waitAsync(head, 0, 0);
    if (res.async) await res.value;
    const stop = Atomics.load(head, 0);
    if(stop == 2){
	console.log("Exiting ..")
	break;
    }else{
	console.log(`Not exiting yet stop is ${stop}`)
    }

    console.log("at last");
     
    Atomics.store(head,0, 0);
    Atomics.notify(head);
	

}


