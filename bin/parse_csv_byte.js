import {MarkovEngine} from "./../lib/parser/markov/parse_escaped.js"
import {Buffer} from "node:buffer"
console.log("creating the parser")


const csv = `pos,id,name,
1,here it is 100,a,
2,200,k,
4,400,a
`


let buffer = Buffer.from(csv);

console.log(buffer);


function parseUnescaped(index,length, acc){
    console.log(index, buffer[index]);
    if(buffer[index]!==0x2C  && buffer[index] != 0xA){
	acc = Buffer.concat([acc, Buffer.from([buffer[index]])]);
	return parseUnescaped(index + 1, length, acc);
    }else if(buffer[index]== 0x2C || buffer[index] == 0xA){
	console.log(acc);
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




function parseFilePerByte(index, length){
    
    if(index < length){
	if(buffer[index] != 0x22 && buffer[index]!= 0xA && buffer[index] !=0x2C){
	    let old_index = index;
	    let [cell , new_index] = parseUnescaped(index, length, Buffer.alloc(0));
	    return addCellToArray(cell, parseFilePerByte(new_index, length))
	}else if(buffer[index]=="\"" && buffer[index] != "\n"){
	    //let par = str;
	    //let [cell, n_str] = parseEscaped(par,"")
	    //return addCellToArray(cell, parseFile(n_str))
	}else if (buffer[index] == 0x2C){
	    console.log("comma")
	    return  parseFilePerByte(index + 1, length) ;

	    
	}else if(buffer[index] == 0xA){
	    console.log("newline")
	    if(index + 2 < length){
		console.log("Finishing " + length + " " + index);
		return  addEmptyArrayToNewLine(parseFilePerByte(index + 1, length)) ;
//		return  parseFile(str.slice(1)) ;
	    }else{
		console.log("the end");
		return parseFilePerByte([])
	    }

	}
    }
    else {
	
	console.log("Descent Finished ");
	return [[]] ;
    }

}


console.log(parseFilePerByte(0,buffer.length))
