import {WirthMarkovFSM} from "../lib/parser/wirth_markov_fsm.js"
import {Buffer} from "node:buffer"

const csv = `pos,id,name
`;

let buffer = Buffer.from(csv);
let result = WirthMarkovFSM(buffer, buffer.length);
console.log(result);

