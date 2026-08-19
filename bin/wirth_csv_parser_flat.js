//import {MarkovEngine} from "./../lib/parser/markov/parse_escaped.js"
import {MarkovEngine} from "./../lib/parser/markov/parse_escaped_byte_no_window.js"
import {Buffer} from "node:buffer"





function parseUnescaped(buffer, index,length){
    //console.log(index, buffer[index]);
    // if(buffer[index]!==0x2C  && buffer[index] != 0xA){
    // 	acc = Buffer.concat([acc, Buffer.from([buffer[index]])]);
    // 	return parseUnescaped(buffer, index + 1, length, acc);
    // }else if(buffer[index]== 0x2C || buffer[index] == 0xA){
    // 	//console.log(acc);
    // 	return [acc, index];
    // }
 //   let acc = Buffer.alloc(0);
    // for(let i = index; i < length; i++){
    // 	if(buffer[index]!==0x2C  && buffer[index] != 0xA){
    // 	    acc = Buffer.concat([acc, Buffer.from([buffer[index]])]);
	   
    // 	}else if(buffer[index]== 0x2C || buffer[index] == 0xA){
    // 	    //console.log(acc);
    // 	    break;
    // 	}
    // }
    // return [acc, index]
 
    let start = index;
    while (index < length && buffer[index] !== 0x2C && buffer[index] !== 0x0A) {
        index++;
    }
    return [buffer.subarray(start, index), index];
}



function addCellToArray(cell, array){
    array[0].unshift(cell);
    return array
}

function addEmptyArrayToNewLine(func){
    
    return [[], ...func];
}




export function WirthCsvParserFlat(buffer, length){
    let lines = [];
    let line = [];
    for(let index =0; index < buffer.length; ){

	if(buffer[index] != 0x22 && buffer[index]!= 0xA && buffer[index] !=0x2C){

	    let [cell , new_index] = parseUnescaped(buffer, index, length );
	    line.push(cell);
	    index = new_index;
	    //return addCellToArray(cell, WirthCsvParser(buffer, new_index, length))
	    //continue;
	}else if(buffer[index]==0x22 && buffer[index] != 0xA){

	    let [result, new_index,cell ] = MarkovEngine(index + 1,buffer)
	    
	    if(result){
	
		if (buffer[new_index - 1] === 0x2C) {

		    //console.log(`cell coma ${cell} index ${new_index}  bufffer ${buffer[new_index - 1]},slice ${cell.slice(0,new_index -1)}`);
		    index = new_index; // Указываем сразу на следующий символ ячейки
		    
		} 
		// Если Марков встал прямо на 0x0A (перенос строки)
		else if (buffer[new_index] === 0x0A) {
		    index = new_index; // Передаем управление ветке 'else if (buffer[index] == 0xA)'
		    //console.log(`cell new line ${cell}`);
		} 
		else {
		    index = new_index;
		}
		//index = new_index;
		line.push(cell);
		//		return addCellToArray(cell, WirthCsvParser(buffer, new_index, length))
	    }else{
		console.log(`Error old index is ${index} ${new_index}, ${length}, last byte ${buffer[length - 1]} line is ${line}`);
		if(new_index === length -2 && buffer[length - 1] === 0x22){
		    //console.log(new_index);
		    line.push(buffer.subarray(index, new_index));
		    //index = new_index + 1;
		    lines.push(line);
		    return lines;
		}else{
		    throw("Some error")
		}
	    }

	}else if (buffer[index] == 0x2C){
	    //console.log("comma")
	    index += 1;
	    //return  WirthCsvParser(buffer, index + 1, length) ;

	    
	}else if(buffer[index] == 0xA){
	    //console.log("newline")
	    if(index + 2 < length){
		//	console.log("Finishing " + length + " " + index);
		lines.push(line);
		line = [];
		index += 1;
		//return  addEmptyArrayToNewLine(WirthCsvParser(buffer, index + 1, length)) ;
		//		return  parseFile(str.slice(1)) ;
	    }else{
		//	console.log("the end");
		lines.push(line);
		break;
		//return WirthCsvParser([])
	    }

	}
    }
    if(line.length > 0){
	lines.push(line);
    }
    return lines;


}


