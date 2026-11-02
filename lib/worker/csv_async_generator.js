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
async function* csv_async_generator(){
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
	unfinishedLine,
	unfinishedCellLength=0;
    let from_consumer = "still empty";

    for (;;){
	
	const res = Atomics.waitAsync(cassetteState, 0, WORKER_TURN);
	if (res.async) await res.value;
	const cassette_state = Atomics.load(cassetteState, 0);
	const tapeStart = indexTapeOffset[0];
	const tapeEnd = tapeStart + indexTapeLength[0];
	const dataStart = dataOffset[0];
	const dataEnd = dataStart + dataLength[0];
	let cleanTapeEnd = tapeEnd;
	let cleanTapeStart = tapeStart;
	
	if(cassette_state == DESTROYED){
	    //here will be end of iteration
	    break;
	}else{
	    console.log("#############################################################")
	    if(unfinishedLine){
		
		let tail = getTail(tapeStart, tapeEnd, indexTape);
		if(tail){
		    let tailLine = getLineTailBytes(tail,u8);

		    //console.log("###################### Sticking together: START ######################")
		    //console.log(`gluedLine is ${Buffer.from(Buffer.concat([unfinishedLine, tailLine]).toString('utf8'))}`)
		    //console.log("###################### Sticking together: END ######################")

		    const additionalCasseteList = normalizeAdditionalCassete(head, tail, unfinishedCellLength);
		    console.log(additionalCasseteList);
		    const merged = new Int32Array(additionalCasseteList);
		    merged.set(additionalCasseteList, 0);
		    //merged.set(tail, head.length);
		    console.log(merged);
		    yield {
			tape: merged,
			data: Buffer.from(Buffer.concat([unfinishedLine, tailLine]))

		    };


		    head = getFullLinesAndUnfinishedHead(tapeStart, tapeEnd, indexTape);
		    [unfinishedLine, unfinishedCellLength] = getUnfinishedLineHeadBytes(
			head,
			u8,
			dataOffset[0] + dataLength[0]
		    );
		    if(head.length > 0){
			cleanTapeEnd = tapeEnd - head.length;
		    }
		    if(tail.length > 0){
			cleanTapeStart = tapeStart +  tail.length + 1;
		    }
		    


		}else {
		    let head_i = getFullLinesAndUnfinishedHead(tapeStart, tapeEnd, indexTape);
		    let [unfinishedLine_i, unfinishedCellLength_i]  = getUnfinishedLineHeadBytes(
			head_i,
			u8,
			dataOffset[0] + dataLength[0]
		    );
		    unfinishedLine = Buffer.concat([unfinishedLine, unfinishedLine_i]);
		    if(head_i.length > 0){
			cleanTapeEnd = tapeEnd - head_i.length;
		    }
		    head = head.concat(head_i);

		}
	    }else{
		head = getFullLinesAndUnfinishedHead(tapeStart, tapeEnd, indexTape);
		[unfinishedLine, unfinishedCellLength] = getUnfinishedLineHeadBytes(
		    head,
		    u8,
		    dataOffset[0] + dataLength[0]
		);
		if(head.length > 0){
		    cleanTapeEnd = tapeEnd - head.length;
		}
	    }
	    //console.log(tapeStart, tapeEnd);
	    yield {
		tape: indexTape.subarray(cleanTapeStart, cleanTapeEnd),
		data: u8, dataStart, dataEnd

	    };

	}

	// console.log("at last");

	Atomics.store(cassetteState,0, WORKER_TURN);
	Atomics.notify(cassetteState);


    }

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
    let head_last = head[head.length -1];
    if (head.length > 0){
	if(head.length > 1){
	    lineHead = buffer.slice(head[0], liveDataEnd);
	    console.log(`unfinisheLine: " ${Buffer.from(lineHead).toString('utf8')}, head last ${head_last - head[0]}, byte length is ${liveDataEnd - head_last -1}`);
	    return [lineHead, liveDataEnd - head_last - 1];
	}
    }
    return [lineHead, undefined];
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


function normalizeAdditionalCassete(head,tail, unfinishedCellLength){
    let head_last = head[head.length - 1];
    if(unfinishedCellLength > 0){
	if(head_last < tail[0]){
	    return normalize(Array.prototype.concat(head,tail));
	}else{
	    if(tail[0]==0){
		
	
		tail[1] = tail[1] + unfinishedCellLength;
	
		return normalize(Array.prototype.concat(head, tail));
	    }else if(head_last && tail[0]){
		console.log(`Cant be ${tail[0]} <  ${head[head_last]}`);
		throw "Cant be this way";
		//return normalize(head, tail);
	    }else{
		return normalize(Array.prototype.concat(head,tail));
	}
	}
    }else{
	return normalize(Array.prototype.concat(head,tail));
    }
    function normalize(tape){
	console.log(tape);
	let length = tape.length;
	let new_tape= [];
	let prev_diff = 0;
	let i = 0
	while (i < length / 2) {
	    const diff = tape[i*2 + 1] + prev_diff - tape[i*2] ;
	    new_tape.push(prev_diff);
	    new_tape.push(diff);
	    prev_diff = diff + 1;
	    i += 1;
	}
	return new_tape;
    }
}




async function process_csv(){
    for await (const cassete of csv_async_generator() ){
	//console.log(cassete);
    }
}




process_csv()
