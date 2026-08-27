import {WirthMarkovFSM} from "../lib/parser/wirth_markov_fsm.js"
import {Buffer} from "node:buffer"

const csv = `pos,"""id""",name
`;
const STATE_CELL = 2;       // Обычное чтение ячейки
const STATE_QUOTED = 1;     // Внутри кавычек
const STATE_QUOTE_CHECK = 3;// Проверка экранирования (встретили кавычку внутри кавычек)
const STATE_START = 0;

// Флаги-сентинелы для ленты разметки
const ROW_END_SENTINEL = -1
//const itable = new Int32Array(256);
// let buffer = Buffer.from(csv),
//     buffer_pointer = 0,
//     itable_pointer= 0,
//     state= STATE_START; //celle

//let result = WirthMarkovFSM(buffer, buffer_pointer,itable, itable_pointer, state );
//console.log(result);

let bufferd= Buffer.from("a,"),
    bufferIndex = 0,
    itable = new Int32Array(256),
    itableIndex =0,
    parserState = 5;

// [parserState,bufferIndex,itable, itableIndex] =  WirthMarkovFSM(buffer, bufferIndex,itable, itableIndex, parserState );
// console.log(`parserState ${parserState}, bufferIndex ${bufferIndex}, itable, itableIndex ${itableIndex}`);
// console.log(itable);

// buffer=  Buffer.from("a,b\n");

// [parserState,bufferIndex,itable, itableIndex] =  WirthMarkovFSM(buffer, bufferIndex,itable, itableIndex, parserState );
// console.log(`parserState ${parserState}, bufferIndex ${bufferIndex}, itable, itableIndex ${itableIndex}`);
// console.log(itable);

let buffers = [Buffer.from("a,"),Buffer.from("a,b"), Buffer.from("a,b,c,d\n"), Buffer.from("a,b,c,d\ne,f,g,h\n")];
for (let buffer of buffers){
    [parserState,bufferIndex,itable, itableIndex] =  WirthMarkovFSM(buffer, bufferIndex,itable, itableIndex, parserState );
    console.log(`parserState ${parserState}, bufferIndex ${bufferIndex}, itable, itableIndex ${itableIndex}`);
    console.log(itable);
}




