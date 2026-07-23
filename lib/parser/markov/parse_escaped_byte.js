console.log("Markov byte automaton");
import {Buffer} from "node:buffer";

let working_examples  = [`ze"""ro me why you lied to me""" ",`,
			 `first me why  you lied to me " ,`,
			 `sec me why """, you lied to me""" ",`,
		 	 `FOURTH me why `,
			 `third me why """, you lied to me """ ",`,
			 `",`,
			 `"""3""""`,
			 `" ,`];


const rules = [
    [Buffer.from([0x22,0x22,0x22]), Buffer.from([0x01,0x22,0x22])],
    [Buffer.from([0x01,0x22,0x22]), Buffer.from([0x01,0x02,0x22])],
    [Buffer.from([0x01,0x02,0x22]), Buffer.from([0x01,0x02,0x3])],
    [Buffer.from([0x22,0x20,0x22]) ,Buffer.from([0x01,0x01,0x1])],
    [Buffer.from([0x22,0x22]), Buffer.from([0x03,0x03,0x3])],
]


const empty_rule = Buffer.from([0x22,0x2c]);




function parse(index, buffer){
    let change = false;
    let current_index = index;
    let initial_index = index;
    let tmp = Buffer.alloc(2);
    console.log(buffer);
    //checking first 2 bytes ", this one
    let n = buffer.copy(tmp,0,index,2);
    console.log(n);
    let match = hack_empty_success(empty_rule, tmp)
    if(match){
	console.log("Success: Empty String");
    }else{
	console.log("Working furhter");
    }


    //    return [true, index];
    
    
    
    // outer_loop: do {
    // 	change = true;

    // 	if(tmp.length < 2){
    // 	    tmp = addToTmpBuf(tmp,buffer[current_index]);
    // 	    current_index += 1;
    // 	    console.log("Acumulating bytes upto length 2")
    // 	    continue outer_loop;
    // 	}
    // 	if(tmp.length == 2){
    // 	    console.log("Checking Empty Good Cell")
    // 	    tmp = addToTmpBuf(tmp,buffer[current_index]);
    // 	    if(hack_empty_success(rules[4][0],tmp)){
    // 		console.log("Success: Empty String");
    // 		return [true, index]
    // 	    }else{
    // 		console.log("Quick Check Finished, getting  to rules")
    // 		//current_index += 1;
    // 		continue outer_loop;
    // 	    }
    // 	}
    // 	//это временно пока отлаживаю
    // 	if(tmp.length >= buffer.length){
    // 	    return [null, "3"]
    // 	}else{
    // 	    tmp = addToTmpBuf(tmp,buffer[current_index]);
    // 	    //current_index += 1;
    // 	}

    
    // 	loop: for (let r of rules){
    // 	    let [match, offset] = cmpTmpToRule(tmp,r[0]);
    // 	    if(match){
    // 		//seq = seq.replace(r[0], r[1]);
    // 		//здесь будет функция переписывания
    // 		console.log(`Founde the rule, offset ${offset}`)
    // 		reInPlaceTmpByRule(tmp, offset,r[1]);
    // 		//current_index += 1;
    // 		change = true
    // 		//return [r[0],""]
    // 		//tmp = addToTmpBuf(tmp,buffer[current_index]);
    // 		continue outer_loop;
    // 	    }
    // 	    //	    if(seq.slice(-9)=="THE_ERROR"){
    
    // 	    if(false){
    // 		//здесь помяню на новый 
    // 		return [false, seq];
    // 	    }
    // 	    else if(false)
    // //	    else if(seq.slice(-7)=="THE_END")
    // 		//console.log(seq);
    // 		return [true, seq]

    
    // 	}
    // 	tmp = addToTmpBuf(tmp,buffer[current_index]);
    // 	console.log(change);
    // 	//return [null, index]
    //     }while(change)

    
}


//это от лени, можно было бы и 3 байтов дождаться но тогда надо было бы отматывать назад
function hack_empty_success(rule, tmp){
    console.log(rule, tmp);
    return Buffer.compare(rule, tmp) == 0;

};

function addToTmpBuf(tmp, b){
    //console.log(tmp, b)
    return Buffer.concat([tmp, Buffer.from([b])]);

}

function cmpTmpToRule(tmp, rule){
    // console.log("cmpToRule");
    //    console.log(tmp, rule);
    const len = tmp.length;
    for(let i = 0;i <= len - rule.length;i++){
	if(Buffer.compare(rule, tmp.subarray(i, i+3)) == 0){
	    
	    return [true, i];
	}
    }
    return [false, null];
}

function reInPlaceTmpByRule(tmp,offset, rule){
    console.log(tmp, offset, rule, rule.length)
    
    rule.copy(tmp,offset,0,2);
    console.log(tmp);
}


console.log(parse(0, Buffer.from(working_examples[5])));
//console.log(parse(0, Buffer.from(working_examples[6])));
//console.log(parse(0, Buffer.from(working_examples[7])));
