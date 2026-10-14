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
const u8 = new Uint8Array(sab);

const w = new Worker('./lib/worker/worker.js', { workerData: { sab, auxData }});

const fileName = "/home/kshakirov/Documents/resources/test_4_buffers.csv";

const fileNameBytes = Buffer.from(fileName, 'utf8');

Atomics.store(cassetteState,0,MAIN_TURN);
filename.set(fileNameBytes.subarray(0, filename.length));
filenameLength[0] = fileNameBytes.length & 0xff;
filenameLength[1] = (fileNameBytes.length >> 8) & 0xff;

Atomics.store(cassetteState,0,WORKER_TURN);
Atomics.notify(cassetteState);
let head = [],
    unfinishedLine;
 

for (;;){
    
    const res = Atomics.waitAsync(cassetteState, 0, WORKER_TURN);
    if (res.async) await res.value;
    const cassette_state = Atomics.load(cassetteState, 0);
    const tapeStart = indexTapeOffset[0];
    const tapeEnd = tapeStart + indexTapeLength[0];
    if(cassette_state == DESTROYED){
	//console.log("Exiting ..")
	//console.log("############################THE END #################################")
	break;
    }else{
	//console.log(`Not exiting yet stop is ${stop}`)
//	console.log(indexTapeOffset, indexTapeLength);
	//console.log(indexTape.slice(tapeStart, tapeStart + 5));
	//console.log(indexTape.slice(tapeEnd - 5, tapeEnd));
	//console.log("#############################################################")
	if(unfinishedLine){

	    let tail = getTail(tapeStart, tapeEnd, indexTape);
	    if(tail){
		let tailLine = getLineTailBytes(tail,u8);
		console.log("###################### Sticking together: START ######################")
		console.log(`gluedLine is ${Buffer.from(Buffer.concat([unfinishedLine, tailLine]).toString('utf8'))}`)
		console.log("###################### Sticking together: END ######################")
	    }else {
		let head_i = getFullLinesAndUnfinishedHead(tapeStart, tapeEnd, indexTape);
		let unfinishedLine_i  = getUnfinishedLineHeadBytes(
	    head_i,
	    u8,
		    dataOffset[0] + dataLength[0]
		);
		unfinishedLine = Buffer.concat([unfinishedLine, unfinishedLine_i]);
		head = head.concat(head_i);
 
	    }
	}
 	head = getFullLinesAndUnfinishedHead(tapeStart, tapeEnd, indexTape);
	unfinishedLine = getUnfinishedLineHeadBytes(
	    head,
	    u8,
	    dataOffset[0] + dataLength[0]
	);
    }

   // console.log("at last");
     
    Atomics.store(cassetteState,0, WORKER_TURN);
    Atomics.notify(cassetteState);
	

}


function getFullLinesAndUnfinishedHead(indexTapeOffset, indexTapeLength, indexTape){
    let new_lines = 0;
    let lastIndex = indexTapeOffset -1 ;
    //here we should solve the issue of allocations we may reuse a buffer allocated advance for the moment a list
    let head = [];


    for (let i = indexTapeOffset; i< indexTapeLength; i++){
	if(indexTape[i]== -1){
	    new_lines += 1;
	    lastIndex = i;
	}
    }
    //console.log(`Last Index: ${lastIndex}`)
    if (lastIndex < indexTapeLength - 1){
	for (let i = lastIndex +1  ; i < indexTapeLength; i++){
	    head.push(indexTape[i]);
	}
    };
    //console.log(`Received: ${new_lines} full lines`);
    //console.log(`Unfinished Line Head is ${head}`);
    return head;
}
function getUnfinishedLineHeadBytes(head, buffer, liveDataEnd){
    let lineHead;
    if (head.length > 0){
	if(head.length > 1){
	    lineHead = buffer.slice(head[0], liveDataEnd);
	    //console.log("unfinisheLine: " + Buffer.from(lineHead).toString('utf8'));
	    return lineHead;
	}
    }
}

function getTail(indexTapeOffset, indexTapeLength, indexTape){
    let firstNewLineIndex=false;
    let tail = [];
    for (let i = indexTapeOffset; i< indexTapeLength; i++){
	if(indexTape[i]== -1){
	    firstNewLineIndex = i;
	    break;
	}else{
	    tail.push(indexTape[i]);
	}
    }
    if(firstNewLineIndex){
	//console.log(`Tail is ${tail}`)
	return tail;
    }
    return false;
    
    
}

function getLineTailBytes(tail,buffer){
    let lineTail;
    if (tail.length > 0){
	if(tail.length > 1){
	    lineTail = buffer.slice(tail[0],tail[tail.length -1]);
	    //console.log("tailLine: " + Buffer.from(lineTail).toString('utf8'));
	    return lineTail;
	}
    }
}
