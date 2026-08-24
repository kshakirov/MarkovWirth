//import {MarkovEngine} from "./../lib/parser/markov/parse_escaped.js"
import {MarkovEngine} from "./markov/parse_escaped_byte_fsm.js"






export function WirthMarkovFSM(buffer, buffer_pointer, itable, itable_pointer, state){

    for(let index =buffer_pointer; index < buffer.length; ){

	if(buffer[index] != 0x22 && buffer[index]!= 0xA && buffer[index] !=0x2C){

	    let [finished,start, end] = parseUnescaped(buffer, index );
	    if(finished){
		index = end;
		itable[itable_pointer]=start;
		itable_pointer+= 1;
		itable[itable_pointer]=end;
		itable_pointer+= 1;
	    }
	}else if(buffer[index]==0x22 && buffer[index] != 0xA){

	    let [result, new_index,cell ] = MarkovEngine(index + 1,buffer)
	    
	    if(result){
	
		if (buffer[new_index - 1] === 0x2C) {
		    index = new_index; // Указываем сразу на следующий символ ячейки
		    
		} 
		else if (buffer[new_index] === 0x0A) {
		    index = new_index; // Передаем управление ветке 'else if (buffer[index] == 0xA)'

		} 
		else {
		    index = new_index;
		}

		line.push(cell);

	    }else{
		console.log(`Error old index is ${index} ${new_index}, ${length}, last byte ${buffer[length - 1]} line is ${line}`);
		if(new_index === length -2 && buffer[length - 1] === 0x22){
		    line.push(buffer.subarray(index, new_index));
		    lines.push(line);
		    return lines;
		}else{
		    throw("Some error")
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
    
    return itable;


}


function parseUnescaped(buffer, index){
    
    let start = index,
	length = buffer.length;
    for(; index < length; index++){
	if(buffer[index]==0x2C || buffer[index]==0x0A)
	    return [true, start, index ];
    }
    return [true, start, index ];

}
