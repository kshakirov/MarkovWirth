//import {MarkovEngine} from "./../lib/parser/markov/parse_escaped.js"
import {MarkovEngine} from "./markov/parse_escaped_byte_no_window.js"






export function WirthMarkovFSM(buffer, buffer_pointer){
    let lines = [];
    let line = [];
    for(let index =0; index < buffer.length; ){

	if(buffer[index] != 0x22 && buffer[index]!= 0xA && buffer[index] !=0x2C){

	    let [cell , new_index] = parseUnescaped(buffer, index, buffer.length );
	    line.push(cell);
	    index = new_index;
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

	    if(index + 2 < buffer.length){
	
		lines.push(line);
		line = [];
		index += 1;
	
	    }else{
	
		lines.push(line);
		break;
	    }

	}
    }
    if(line.length > 0){
	lines.push(line);
    }
    return lines;


}


function parseUnescaped(buffer, index,length){
 
    let start = index;
    while (index < length && buffer[index] !== 0x2C && buffer[index] !== 0x0A) {
        index++;
    }
    return [buffer.subarray(start, index), index];
}
