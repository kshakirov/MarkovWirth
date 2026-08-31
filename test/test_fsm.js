import {WirthMarkovFSM} from "../lib/parser/wirth_markov_fsm.js"
import {Buffer} from "node:buffer"


let bufferIndex = 0,
    itable = new Int32Array(256),
    itableIndex =0,
    parserState = 5;


let buffers = [Buffer.from(","),Buffer.from(",b,"), Buffer.from(",b,c,d\n"), Buffer.from(",b,c,d\ne,f,g,h\n")];
for (let buffer of buffers){
    [parserState,bufferIndex,itable, itableIndex] =  WirthMarkovFSM(buffer, bufferIndex,itable, itableIndex, parserState );
    console.log(`parserState ${parserState}, bufferIndex ${bufferIndex}, itable, itableIndex ${itableIndex}`);
    console.log(itable);
}






