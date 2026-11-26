import { WirthMarkovCsvReader} from "../lib/stream/reader/csv_reader.js";

import {

    OWNED,
    BORROWED
} from '../lib/worker/shared_layout.js';

console.log("testing");


const csv_reader =  new WirthMarkovCsvReader("/home/kshakirov/Documents/resources/test_4_buffers.csv");

csv_reader.on('data', (chunk)=> {
    if(chunk.type== BORROWED){
	csv_reader.releaseCassette();
	console.log(chunk);
    }


				})
