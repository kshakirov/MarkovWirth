import { MarkovEngine } from '../lib/parser/markov/parse_escaped_byte_no_window.js'
function generateExcluleSensitive(){
    return Math.floor(Math.random() * 220) + 35 ;
}

function generatePositiveBufferWithOnlyEnd(length){
    const buf = Buffer.alloc(length);
    for(let i = 0; i < length -2 ; i++){
	buf[i] =generateExcluleSensitive();
    }
    buf[length -2] = 0x22;
    buf[length -1] = 0x2C;
    return buf;
    
}

function verifyPositiveWithOnlyEnd(n){
    const startIndex=0;
    for(let i = 0; i< n; i++){
	const testLength = Math.floor(Math.random() * 200) + 3; // длины от 1 до 200 байт
	//const testLength = 32;
	let buf =generatePositiveBufferWithOnlyEnd(testLength);
	//console.log(buf)
	let [result, index, n_buff] = MarkovEngine(startIndex, buf);
	//console.log(buf);
	//console.log(result);
	if(!result){
	    console.log(`The length is ${buf.length}`)
	    console.log("Failed the index is below");
	    console.log(index, `${buf[index]}`);
	    console.log(buf);
	}
    }
}

verifyPositiveWithOnlyEnd(100);


const evilBuffer = Buffer.from([
    0x53, 0xb6, 0x3a, 0xed, 0xe8, 0x8c, 0xf0, 0x40, 
    0xa2, 0xfb, 0x8b, 0x46, 0x85, 0xe2, 0xbc, 0x32, 
    0xd5, 0x80, 0xb1, 0x3c, 0xc7, 0x94, 0x22, 0x2C
]);

const evilBuffer17 = Buffer.from([
    0xd0, 0x60, 0x4d, 0xa6, 0xf0, 0xfe, 0xc4, 0xa4, 
    0xca, 0xe2, 0x98, 0x24, 0x4a, 0xb8, 0x29, 0x22, 0x2c
]);

function verifyFixed(buf){
    const startIndex=0;


    let [result, index, n_buff] = MarkovEngine(startIndex, buf);
    
    if(!result){
	console.log(`The length is ${buf.length}`)
	console.log("Failed the index is below");
	console.log(index, `${buf[index]}`);
	console.log(buf);
    }

}

//verifyFixed(evilBuffer17);
