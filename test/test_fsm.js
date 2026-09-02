import {WirthMarkovFSM} from "../lib/parser/wirth_markov_fsm.js"
import {Buffer} from "node:buffer"


let bufferIndex = 0,
    itable = new Int32Array(256),
    itableIndex =0,
    parserState = 5;


// let buffers = [Buffer.from("a,"),Buffer.from("a,b,"), Buffer.from("a,b,c,d\n"), Buffer.from("a,b,c,d\ne,f,g,h\n")];
// for (let buffer of buffers){
//     [parserState,bufferIndex,itable, itableIndex] =  WirthMarkovFSM(buffer, bufferIndex,itable, itableIndex, parserState );
//     console.log(`parserState ${parserState}, bufferIndex ${bufferIndex}, itable, itableIndex ${itableIndex}`);
//     console.log(itable);
// }


//let payload = Buffer.from("a,b,c,d\ne,f,g,h\n")
//let payload = Buffer.from(",b,c,d\ne,f,g,h\n")
let payload = Buffer.from(",,\n,,\n")


for (let i =0;i<= payload.length;i++){
    [parserState,bufferIndex,itable, itableIndex] =  WirthMarkovFSM(payload.subarray(0,i), bufferIndex,itable, itableIndex, parserState );
    console.log(`parserState ${parserState}, bufferIndex ${bufferIndex}, itable, itableIndex ${itableIndex}`);
    console.log(itable);
    console.log(payload.subarray(0,i));
}

