import {WirthMarkovFSM} from "../lib/parser/wirth_markov_fsm.js"
import {Buffer} from "node:buffer"

const csv = `pos,id,name
`;
const STATE_CELL = 2;       // Обычное чтение ячейки
const STATE_QUOTED = 1;     // Внутри кавычек
const STATE_QUOTE_CHECK = 3;// Проверка экранирования (встретили кавычку внутри кавычек)
const STATE_START = 0;

// Флаги-сентинелы для ленты разметки
const ROW_END_SENTINEL = -1
const itable = new Int32Array(256);
let buffer = Buffer.from(csv),
    itable_pointer= 0,
    state= STATE_START; //celle

let result = WirthMarkovFSM(buffer, buffer.length,itable, itable_pointer, state );
console.log(result);

