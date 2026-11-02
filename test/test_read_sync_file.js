import fs from 'node:fs'
import {Buffer} from 'node:buffer'
import { WirthCsvParserFlat } from '../bin/wirth_csv_parser_flat.js';
console.log("Testing reading sync file ");


//let fd = fs.openSync("/home/kshakirov/Documents/resources/sample_hr_clean.csv", "r");
let fd = fs.openSync("/home/kshakirov/Documents/resources/london_crime_by_lsoa.csv", "r");
console.log(fd)

let buf = Buffer.alloc(64000),
bufSize = buf.length,
offset = 0,
chunk = 256;
let csv_buffer = Buffer.alloc(0);
for (let position=0; position < 100000000; position += chunk){
    if(position + chunk > bufSize){
	let addedBuffer = Buffer.alloc(bufSize*2);
	buf.copy(addedBuffer,0,0);
	buf = addedBuffer;
	bufSize *=2;
	console.log(`Extended Array the size is ${bufSize}`)
    }
    if(offset ==0){
	offset = 256;
    }else{
	offset = position - chunk;
    }
    let readBytes = fs.readSync(fd, buf,offset, chunk, position);
    if(readBytes < 256){
	console.log("All data read");
	break;
    }
}


let lines = WirthCsvParserFlat(buf,buf.length);
console.log(lines.length)
for (let line of lines.splice(0,100)){
    console.log(`${line}`);
}
