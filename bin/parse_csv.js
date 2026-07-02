import fs from 'node:fs'

console.log("creating the parser")


const csv = `pos,id,name
1,100,k
`

function parseUnescaped(str, acc){
  //  console.log(str)

    if(str[0]!= "," && str[0]!="\n"){
	return parseUnescaped(str.slice(1), acc + str[0]);

    }else if(str[0]=="\n" || str[0]==","){
	
	return [acc, str];

    }
    
}

// function parseEscaped(str, options){
//     console.log(str[0])
//     if(str[0]!=="\"" && str[0]!="\n"){

// 	return str[0] + parseEscaped(str.slice(1));

//     }else if(str[0]=="\""){

// 	return str[0] + parseEscaped(str.slice(1), {quote_flag: true, occurence: 1});;

//     }
//     else if (options && options.quote_flag){		
// 	if(str[0]=="\n" && options.occurence == 1 ){
// 	    parseFile(str.slice(1));
// 	    return "__NEWLINE___";
	    
// 	}else if(str[0]=="\"" && options.occurence == 1){
// 	    return str[0] + parseEscaped(str.slice(1), {quote_flag: true, occurence: 2});
// 	}else if(str[0]=="\"" && options.occurence == 2){
// 	    return str[0] + parseEscaped(str.slice(1));
// 	}
	
//     }
//     else{
// 	parseFile(str.slice(1));
// 	return ""

//     }
// }

function addCellToArray(cell, array){
    array[0].push(cell);
    return array
}

function addEmptyArrayToNewLine(func){
    
    return [[], ...func];
}

function parseFile(str){
    
    if(str.length > 0){
	if(str[0]!=="\"" && str[0]!="\n" && str[0] !=","){
	    let par = str;
	    let [cell , n_str] = parseUnescaped(par, "");
//	    return [cell, ...parseFile(n_str)]
	    return addCellToArray(cell, parseFile(n_str))
	}else if(str[0]=="\"" && str[0] != "\n"){
	    let cell, str = parseEscaped(str.slice(1), {quote_flag: false})
	}else if (str[0] == ","){
	    //	    console.log(`It it the end of a cell ${str}`);
	    return  parseFile(str.slice(1)) ;

	    
	}else if(str[0]=="\n"){
	    console.log(str.length)
	    if(str.length >= 1){
		return  addEmptyArrayToNewLine(parseFile(str.slice(1))) ;
//		return  parseFile(str.slice(1)) ;
	    }else{
		return parseFile([])
	    }

	}
    }
    else {
	
	console.log("Finishing ");
	return [] ;
    }

}



let result = parseFile(csv);


console.log(JSON.stringify(result));
