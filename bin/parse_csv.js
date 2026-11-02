import {MarkovEngine} from "./../lib/parser/markov/parse_escaped.js"
console.log("creating the parser")


const csv = `pos,id,name,
1," here it is 100 ",a,
2,200,k,
3," tell me """ here """ ","kkk ee",
4,400,a
`

function parseUnescaped(str, acc){
    if(str[0]!= "," && str[0]!="\n"){
	return parseUnescaped(str.slice(1), acc + str[0]);
    }else if(str[0]=="\n" || str[0]==","){
	return [acc, str];
    }
}

function parseEscaped(str, acc){
    console.log(`Entering parseescaped with acc ${acc}`);
    let [result, orig] = MarkovEngine(acc);
    if(result){
	let ro = orig.slice(0,-1);
	console.log(`All parsed: ${orig} without , ${ro} `);
	return [ro,str]
    }else if (result == null){
	console.log(`Not Yet Parsed: ${acc}`);
	return parseEscaped(str.slice(1), acc + str[0]);
    }

}


function addCellToArray(cell, array){
    array[0].unshift(cell);
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
	    return addCellToArray(cell, parseFile(n_str))
	}else if(str[0]=="\"" && str[0] != "\n"){
	    let par = str;
	    let [cell, n_str] = parseEscaped(par,"")
	    return addCellToArray(cell, parseFile(n_str))
	}else if (str[0] == ","){
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


//console.log(JSON.stringify(result));
for (let r of result){
    console.log(r);
}
