//import {MarkovEngine} from "./../lib/parser/markov/parse_escaped.js"
import {MarkovEngine} from "./markov/parse_escaped_byte_fsm.js"

const UNESCAPED = 1,
      FINISHED =2,
      ERROR=4,
      START=5,
      COMMA=6,
      NO_COMMA=7,
      NO_EOF = 3;



export function WirthMarkovFSM(buffer, bufferIndex, itable, itableIndex, parserState){
    let index = bufferIndex;
   // console.log(`parserState:[${parserState}]bufferIndex is ${bufferIndex}`)
    if(parserState === UNESCAPED){
	//console.log("Restarting  unescaped");
	let [finished,start, end] = parseUnescaped(buffer, index );
	console.log(finished,start, end)
	if(finished){
	    index = end;
	    itable[itableIndex]=start;
	    itableIndex+= 1;
 	    itable[itableIndex]=end;
	    itableIndex+= 1;
	    parserState=NO_COMMA;
	}else{
	    return [UNESCAPED, start, itable, itableIndex ]

	}
    }
    for(; index < buffer.length; ){
	//console.log(`Inner  cycle index:[${index}], current byte is ${buffer[index]}`)
	if(buffer[index] != 0x22 && buffer[index]!= 0xA && buffer[index] !=0x2C){

	    let [finished,start, end] = parseUnescaped(buffer, index );
	    if(finished){
		index = end;
		itable[itableIndex]=start;
		itableIndex+= 1;
 		itable[itableIndex]=end;
		itableIndex+= 1;
		parserState= NO_COMMA;
	    }else{
		return [UNESCAPED, start, itable, itableIndex ]
	    }
	}else if(buffer[index]==0x22 && buffer[index] != 0xA){

	    let [finished, start, end] = MarkovEngine(index + 1,buffer)
	    
	    if(finished){
 		itable[itableIndex]=start;
		itableIndex+= 1;
		if (buffer[end - 1] === 0x2C) {
		    index = end; // Указываем сразу на следующий символ ячейки
		    itable[itableIndex]=end -1;
		    
		} 
		else if (buffer[end] === 0x0A) {
		    index = end; // Передаем управление ветке 'else if (buffer[index] == 0xA)'
		    itable[itableIndex]=end;

		} 
		else {
		    index = end;
		    itable[itableIndex]=end;
		}

		itableIndex+= 1;


//		line.push(cell);

	    }else{
		console.log(`Error old index is ${index}`);
		if(end === buffer.length - 2 && buffer[buffer.length - 1] === 0x22){
		   //if buffer finishes with " just a quote this is valid for casess where there is no new line and is supposed to be EOF file but this one is external to Wirth
		    //return lines;
		    //index = end + 1; //to be thought about still
		    itable[itableIndex]=start;
		    itableIndex+= 1;
		    itable[itableIndex] = buffer.length;
		    itableIndex+= 1;
		    //return itable;
		    return [NO_EOF, index, itable, itableIndex];
		    
		}else{
		    throw("Some error")//needs to be specified
		}
	    }

	}else if (buffer[index] == 0x2C){


	    if(parserState===COMMA || parserState == START){
		itable[itableIndex]=index;
		itableIndex+= 1;
		itable[itableIndex]=index;
		itableIndex+= 1;
	    }
	    index += 1;
	    if(index=== buffer.length){
		return [COMMA, index, itable,itableIndex];

	    }
	    parserState=COMMA;
	    

	    
	}else if(buffer[index] == 0xA){
	    if(parserState === COMMA){
		itable[itableIndex]=index;
		itableIndex+= 1;
		itable[itableIndex]=index;
		itableIndex+= 1;
		
	    }
	    itable[itableIndex]=-1;
	    itableIndex += 1;
	    parserState=NO_COMMA;
	    if(index < buffer.length){
		index += 1;
	    }
	    
	    if(index=== buffer.length){
		return [START, index, itable,itableIndex];

	    }

	}
    }
    
    return [FINISHED, index, itable, itableIndex];


}


function parseUnescaped(buffer, index){
    
    let start = index,
	length = buffer.length;
    for(; index < length; index++){
	if(buffer[index]==0x2C || buffer[index]==0x0A)
	    return [true, start, index ];
    }
    return [false, start, index ];

}
