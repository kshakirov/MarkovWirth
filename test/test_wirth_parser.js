import {MarkovEngine} from "./../lib/parser/markov/parse_escaped_byte_no_window.js"
import {WirthCsvParser} from "../bin/wirth_csv_parser.js"
import {Buffer} from "node:buffer"



const csv = `pos,id,name,
1,here it is 100,a,
2,200,k,
3," ""3"" ",1,
4,400,a,
5,500,b
`


let buffer = Buffer.from(csv);

let result = WirthCsvParser(buffer, 0, buffer.length);
console.log(result);
