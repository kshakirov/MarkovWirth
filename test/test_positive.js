import { MarkovEngine } from '../lib/parser/markov/parse_escaped_byte.js'
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
	const testLength = Math.floor(Math.random() * 200) + 2; // длины от 1 до 200 байт
	let buf =generatePositiveBufferWithOnlyEnd(testLength);
	//console.log(buf.length)
	let [result, index, n_buff] = MarkovEngine(startIndex, buf);
	//console.log(buf);
	//console.log(result);
	if(!result){
	    console.log(`The length is ${buf.length}`)
	    console.log("Failed the index is below");
	    console.log(buf[index], `${buf[index]}`);
	    console.log(`buf is ${buf}`);
	}
    }
}

verifyPositiveWithOnlyEnd(10);
