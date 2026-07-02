import fs from 'node:fs'

console.log("creating the parser")


const csv = `
pos,id,name
1,100,Kirill
2,200,Vasiliy
`






function markEscaped(){
    current_stage = "ESCAPED";
}

function markUnescaped(){
}

function markEscapedBody(){
}

function markEmpty(){
    
}

function markLbrk(){
    
}

function runEscped(){
    
}



function parseUnescaped(str){
    if(str[0]!= "," && str[0]!="\n"){
	parseUnescaped(str.slice(1))
	return str[0];
    }else{
	parseFile(str.slice(1));
    }
}
      
function parseEscaped(str){
    //check if not another "" later
    if(str[0]==","){
	parseEscaped(str.slice(1));
	return ch;
    }else{
	parseFile()
    }
}


function  parseFile(str){
    let row = []
//    console.log(`parseFile ${str}`)
    if(str.length == 0){
	console.log("Finished");
	return row;
	
    }
    else if(str[0]!=="\""){
	let cell = [];
	cell.push(parseUnescaped(str.slice(1)));
	//console.log(cell);
	row.push(cell);

    }else if(str[0]=="\"" && str[0] != "\n"){
	 parseEscaped(str.slice(1))
    }else if(str[0]=="\n" && str.length > 1){
	 return parseFile(str.slice(1));
    }
    else {
	
	console.log("some unkonwn character " + ch );
    }

}

let result = parseFile(csv);

console.log(result);
