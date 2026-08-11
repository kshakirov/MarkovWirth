import {MarkovEngine} from "./../lib/parser/markov/parse_escaped_byte_no_window.js"
import {WirthCsvParser} from "../bin/wirth_csv_parser.js"
import {Buffer} from "node:buffer"



const csv = `pos,id,name,
1,here it is 100,a,
2,200,k,
3," ""3"" ",1,
77,"""i""","""eg60an7o""",
4,400,a,
5,500,b
`
const csv2= `"""utjfwf""",f5c1za04l,"""68op6""",1
`
const csv3 = `ip3xrpe,"""u7v""","""7xfxbfbqc""","""yh""","""qj5xckcy""",1
`
const csv4 = `"""0f2rn""","""xzj""",548`
let buffer = Buffer.from(csv2);

let result = WirthCsvParser(buffer, 0, buffer.length);
console.log(result);
