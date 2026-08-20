import {WirthMarkovFSM} from "../lib/parser/wirth_markov_fsm.js"
import {Buffer} from "node:buffer"

const csv = `pos,id,name
`;
const itable = new Int16Array(256);
let buffer = Buffer.from(csv);
let result = WirthMarkovFSM(buffer, buffer.length,itable );
console.log(result);

