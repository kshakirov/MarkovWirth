//import {MarkovEngine} from "./../lib/parser/markov/parse_escaped.js"
import {MarkovEngine} from "./markov/parse_escaped_byte_fsm.js"

const UNESCAPED = 1,
      FINISHED =2,
      NO_EOF = 3;



export function WirthMarkovFSM(buffer, buffer_pointer, itable, itable_pointer, state){
    let index = buffer_pointer;
    for(; index < buffer.length; ){

	if(buffer[index] != 0x22 && buffer[index]!= 0xA && buffer[index] !=0x2C){

	    let [finished,start, end] = parseUnescaped(buffer, index );
	    if(finished){
		index = end;
		itable[itable_pointer]=start;
		itable_pointer+= 1;
 		itable[itable_pointer]=end;
		itable_pointer+= 1;
	    }else{
		return [UNESCAPED, start, itable, itable_pointer ]
	    }
	}else if(buffer[index]==0x22 && buffer[index] != 0xA){

	    let [finished, start, end] = MarkovEngine(index + 1,buffer)
	    
	    if(finished){
 		itable[itable_pointer]=start;
		itable_pointer+= 1;
		if (buffer[end - 1] === 0x2C) {
		    index = end; // Указываем сразу на следующий символ ячейки
		    itable[itable_pointer]=end -1;
		    
		} 
		else if (buffer[end] === 0x0A) {
		    index = end; // Передаем управление ветке 'else if (buffer[index] == 0xA)'
		    itable[itable_pointer]=end;

		} 
		else {
		    index = end;
		    itable[itable_pointer]=end;
		}

		itable_pointer+= 1;


//		line.push(cell);

	    }else{
		console.log(`Error old index is ${index}`);
		if(end === buffer.length - 2 && buffer[buffer.length - 1] === 0x22){
		   //if buffer finishes with " just a quote this is valid for casess where there is no new line and is supposed to be EOF file but this one is external to Wirth
		    //return lines;
		    //index = end + 1; //to be thought about still
		    itable[itable_pointer]=start;
		    itable_pointer+= 1;
		    itable[itable_pointer] = buffer.length;
		    itable_pointer+= 1;
		    //return itable;
		    return [NO_EOF, index, itable, itable_pointer];
		    
		}else{
		    throw("Some error")//needs to be specified
		}
	    }

	}else if (buffer[index] == 0x2C){

	    index += 1;

	    
	}else if(buffer[index] == 0xA){
	    itable[itable_pointer]=-1;
	    itable_pointer += 1;
	    if(index < buffer.length){
		index += 1;
	    }

	}
    }
    
    return [FINISHED, index, itable, itable_pointer];


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
