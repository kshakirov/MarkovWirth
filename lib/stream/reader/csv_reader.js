import { Worker } from 'worker_threads';
import  {Readable} from 'stream'
import {
    AUX_DATA_CAPACITY,
    CANCEL_REQUESTED,
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
} from '../../worker/shared_layout.js';

class WirthMarkovCsvReader extends Readable {
    constructor(fileName, options) {
	super({...options, objectMode: true});
	const auxData = new SharedArrayBuffer(AUX_DATA_CAPACITY);
	const sab = new SharedArrayBuffer(DATA_BUFFER_CAPACITY);
	this.cassetteState  = new Int32Array(auxData, CASSETTE_STATE_OFFSET, 1);
	this.dataOffset = new Int32Array(auxData, DATA_OFFSET_OFFSET, 1);
	this.dataLength = new Int32Array(auxData, DATA_LENGTH_OFFSET, 1);
	this.indexTapeOffset = new Int32Array(auxData, INDEX_TAPE_OFFSET_OFFSET, 1);
	this.indexTapeLength = new Int32Array(auxData, INDEX_TAPE_LENGTH_OFFSET, 1);
	const filenameLength = new Uint8Array(auxData, FILENAME_LENGTH_OFFSET, FILENAME_LENGTH_CAPACITY);
	const filename = new Uint8Array(auxData, FILENAME_OFFSET, FILENAME_CAPACITY);
	this.indexTape = new Int32Array(
	    auxData,
	    INDEX_TAPE_OFFSET,
	    INDEX_TAPE_CAPACITY
	);

	this.u8 = new Uint8Array(sab);

	this.w = new Worker('./lib/worker/worker.js', { workerData: { sab, auxData }});
	const fileNameBytes = Buffer.from(fileName, 'utf8');
	Atomics.store(this.cassetteState,0,MAIN_TURN);
	filename.set(fileNameBytes.subarray(0, filename.length));
	filenameLength[0] = fileNameBytes.length & 0xff;
	filenameLength[1] = (fileNameBytes.length >> 8) & 0xff;

	Atomics.store(this.cassetteState,0,WORKER_TURN);
	Atomics.notify(this.cassetteState);
	this.head = [],
	    this.unfinishedLine,
	    this.unfinishedCellLength=0;
	this.cleanTapeEnd = 0;
	this.cleanTapeStart =0;
	
    }

    
    _read = async function(n){
	let from_consumer = "still empty";
	try {
	    for (;;){
		
		const res = Atomics.waitAsync(this.cassetteState, 0, WORKER_TURN);
		if (res.async) await res.value;
		const cassette_state = Atomics.load(this.cassetteState, 0);
		const tapeStart = this.indexTapeOffset[0];
		const tapeEnd = tapeStart + this.indexTapeLength[0];
		const dataStart = this.dataOffset[0];
		const dataEnd = dataStart + this.dataLength[0];
		this.cleanTapeEnd = tapeEnd;
		this.cleanTapeStart = tapeStart;
		
		if(cassette_state == DESTROYED){
		    //here will be end of iteration
		    break;
		}else{
		    console.log("#############################################################")
		    if(this.unfinishedLine){
			
			let tail = getTail(tapeStart, tapeEnd, this.indexTape);
			if(tail !== null){
			    let tailLine = getLineTailBytes(tail,this.u8);

			    //console.log("###################### Sticking together: START ######################")
			    //console.log(`gluedLine is ${Buffer.from(Buffer.concat([this.unfinishedLine, tailLine]).toString('utf8'))}`)
			    //console.log("###################### Sticking together: END ######################")

			    const additionalCasseteList = normalizeAdditionalCassete(this.head, tail, this.unfinishedCellLength);
			    console.log(additionalCasseteList);
			    const merged = new Int32Array(additionalCasseteList);
			    merged.set(additionalCasseteList, 0);
			    //merged.set(tail, this.head.length);
			    
			    console.log(merged);
			    this.push({
				tape: merged,
				data: Buffer.from(Buffer.concat([this.unfinishedLine, tailLine]))

			    });
			    
			    
			    

			    this.head = getFullLinesAndUnfinishedHead(tapeStart, tapeEnd, this.indexTape);
			    [this.unfinishedLine, this.unfinishedCellLength] = getUnfinishedLineHeadBytes(
				this.head,
				this.u8,
				this.dataOffset[0] + this.dataLength[0]
			    );
			    if(this.head.length > 0){
				this.cleanTapeEnd = tapeEnd - this.head.length;
			    }
			    this.cleanTapeStart = tapeStart + tail.length + 1;
			    


			}else {
			    let head_i = getFullLinesAndUnfinishedHead(tapeStart, tapeEnd, this.indexTape);
			    let [unfinishedLine_i, unfinishedCellLength_i]  = getUnfinishedLineHeadBytes(
				head_i,
				this.u8,
				this.dataOffset[0] + this.dataLength[0]
			    );
			    this.unfinishedLine = Buffer.concat([this.unfinishedLine, unfinishedLine_i]);
			    if(head_i.length > 0){
				this.cleanTapeEnd = tapeEnd - head_i.length;
			    }
			    this.head = this.head.concat(head_i);

			}
		    }else{
			this.head = getFullLinesAndUnfinishedHead(tapeStart, tapeEnd, this.indexTape);
			[this.unfinishedLine, this.unfinishedCellLength] = getUnfinishedLineHeadBytes(
			    this.head,
			    this.u8,
			    this.dataOffset[0] + this.dataLength[0]
			);
			if(this.head.length > 0){
			    this.cleanTapeEnd = tapeEnd - this.head.length;
			}
		    }
		    //console.log(tapeStart, tapeEnd);

		    this.push( {
			tape: this.indexTape.subarray(this.cleanTapeStart, this.cleanTapeEnd),
			data: this.u8, dataStart, dataEnd

		    });
		    
		}

		// console.log("at last");

		Atomics.store(this.cassetteState,0, WORKER_TURN);
		Atomics.notify(this.cassetteState);


	    }
	}finally{
	    console.log("Finalizing: Stopping the Worker....");
	    if(Atomics.load(this.cassetteState, 0) !== DESTROYED){
		Atomics.store(this.cassetteState,0, CANCEL_REQUESTED);
		Atomics.notify(this.cassetteState, 0);
		while(Atomics.load(this.cassetteState, 0) !== DESTROYED){
		    const finalRes = Atomics.waitAsync(this.cassetteState, 0 , CANCEL_REQUESTED);
		    if (finalRes.async) await finalRes.value;
		}
	    }
	    if(Atomics.load(this.cassetteState,0)  === DESTROYED){
		console.log("Finalizing: Worker  Stopped, good bye");
	    }else{
		console.log("Qutting Normally ...");
	    }

	    
	}


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
    let tail = [];
    for (let i = indexTapeOffset; i< indexTapeLength; i++){
	if(indexTape[i]== -1){
	    return tail;
	}else{
	    tail.push(indexTape[i]);
	}
    }
    return null;
}

function getLineTailBytes(tail,buffer){
    if (tail.length > 1){
	return buffer.slice(tail[0],tail[tail.length -1]);
    }
    return buffer.subarray(0, 0);
}


function normalizeAdditionalCassete(head,tail, unfinishedCellLength){
    let head_last = head[head.length - 1];
    if(unfinishedCellLength > 0){
	if(head_last < tail[0]){
	    return normalize(Array.prototype.concat(head,tail));
	}else{
	    if(tail[0]==0){
		const tape = Array.prototype.concat(head, tail);
		tape[head.length + 1] += unfinishedCellLength;
		return normalize(tape);
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
	new_tape.push(-1);
	return new_tape;
    }
}
