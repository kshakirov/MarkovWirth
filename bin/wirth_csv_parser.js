//import {MarkovEngine} from "./../lib/parser/markov/parse_escaped.js"
import {MarkovEngine} from "./../lib/parser/markov/parse_escaped_byte_no_window.js"
import {Buffer} from "node:buffer"





function parseUnescaped(buffer, index,length, acc){
    //console.log(index, buffer[index]);
    if(buffer[index]!==0x2C  && buffer[index] != 0xA){
	acc = Buffer.concat([acc, Buffer.from([buffer[index]])]);
	return parseUnescaped(buffer, index + 1, length, acc);
    }else if(buffer[index]== 0x2C || buffer[index] == 0xA){
	//console.log(acc);
	return [acc, index];
    }
}


function addCellToArray(cell, array){
    array[0].unshift(cell);
    return array
}

function addEmptyArrayToNewLine(func){
    
    return [[], ...func];
}




export function WirthCsvParser(buffer, index, length){
    
    if(index < length){
	if(buffer[index] != 0x22 && buffer[index]!= 0xA && buffer[index] !=0x2C){
	    let old_index = index;
	    let [cell , new_index] = parseUnescaped(buffer, index, length, Buffer.alloc(0));
	    return addCellToArray(cell, WirthCsvParser(buffer, new_index, length))
	}else if(buffer[index]==0x22 && buffer[index] != 0xA){
	    //let par = str;
	    let [result, new_index,cell ] = MarkovEngine(index + 1,buffer)
	    
	    if(result){
		//console.log(cell[cell.length - 1], new_index);
		//console.log(cell);
//		return addCellToArray(cell.subarray(0, -1), parseFilePerByte(new_index, length))
		return addCellToArray(cell, WirthCsvParser(buffer, new_index, length))
	    }else{
		console.log(`Error ${new_index}, ${cell}`);
		throw("Some error")
	    }

	}else if (buffer[index] == 0x2C){
	    //console.log("comma")
	    return  WirthCsvParser(buffer, index + 1, length) ;

	    
	}else if(buffer[index] == 0xA){
	    //console.log("newline")
	    if(index + 2 < length){
	//	console.log("Finishing " + length + " " + index);
		return  addEmptyArrayToNewLine(WirthCsvParser(buffer, index + 1, length)) ;
//		return  parseFile(str.slice(1)) ;
	    }else{
	//	console.log("the end");
		return WirthCsvParser([])
	    }

	}
    }
    else {
	
	console.log("Descent Finished ");
	return [[]] ;
    }

}


