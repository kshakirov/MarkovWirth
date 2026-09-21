
import { workerData}  from 'worker_threads';
import fs from 'node:fs'
import {Buffer} from 'node:buffer';
//console.log('init with', workerData);


const sab = workerData.sab;
const auxData = workerData.auxData;
const head  = new Int32Array(auxData, 0, 1);
const state = new Int32Array(auxData, 4, 1);
const data  = new Uint8Array(auxData, 8);
const view = new Uint8Array(sab);       // один раз
const buf = Buffer.from(view.buffer, view.byteOffset, view.byteLength)

const fileName =  "/home/kshakirov/Documents/resources/london_crime_by_lsoa_short_1.csv";
//this is a start message with thef filename


const fd = fs.openSync(fileName, 'r'),
      chunk_size = 1024,
      bufferSize = 64 * 1024;
const mod = (a, b) => ((a % b) + b) % b;

let i =0;
let readBytes;
while ((readBytes =  fs.readSync(fd,buf,mod(i*chunk_size,bufferSize) , chunk_size )) > 0){

    console.log(`Worker: read Bytes ${readBytes}`);
    if (readBytes > 0){
	Atomics.store(head, 0,1);
	Atomics.notify(head);

	
    }else {
	Atomics.store(head, 0,2);
	Atomics.notify(head);
    }

    i+=1;
    Atomics.wait(head,0, 1);


}




console.log("All done");







