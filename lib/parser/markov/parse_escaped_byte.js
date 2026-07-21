console.log("Markov byte automaton");
import {Buffer} from "node:buffer";

let working_examples  = [`zero me why """you lied to me""" ",`,
			 `first me why  you lied to me " ,`,
			 `sec me why """, you lied to me""" ",`,
		 	 `FOURTH me why `,
			 `third me why """, you lied to me """ ",`,
			 `",`,
			 `" ,`];


const rules = [
    [Buffer.from([0x22,0x22,0x22]), Buffer.from([0x01,0x22,0x22])],
    [Buffer.from([0x01,0x22,0x22]), Buffer.from([0x01,0x02,0x22])],
    [Buffer.from([0x01,0x02,0x22]), Buffer.from([0x01,0x02,0x3])],
    [Buffer.from([0x22,0x20,0x22]) ,Buffer.from([0x01,0x01,0x1])],
    [Buffer.from([0x22,0x22]), Buffer.from([0x03,0x03,0x3])],
]







function parse(index, buffer){

    let change = false;
    let current_index = index;
    let initial_index = index;
    let tmp = Buffer.alloc(0);
    outer_loop: do {
	change = false;

	if(tmp.length < 2){
	    tmp = addToTmpBuf(tmp,buffer[current_index]);
	    current_index += 1;
	    change = true;
	    console.log("Acumulating bytes upto length 2")
	    continue outer_loop;
	}
	if(tmp.length == 2){
	    console.log("Checking Empty Good Cell")
	    addToTmpBuf(tmp,buffer[current_index]);
	    if(hack_empty_success(rules[4][0],tmp)){
		console.log("Success: Empty String");
		return [true, index]
	    }else{
		current_index += 1;
		change = true
		continue outer_loop
	    }
	}
	if(tmp.length > 2){
	    return [null, "3"]
	}

	
	loop: for (let r of rules){
	    if(r[0].test(seq)){
		seq = seq.replace(r[0], r[1]);
		change = true
		
		//console.log(seq, r);
		continue outer_loop;
	    }
	    if(seq.slice(-9)=="THE_ERROR"){
		//console.log(seq);
		return [false, seq];
	    }
	    else if(seq.slice(-7)=="THE_END")
		//console.log(seq);
		return [true, seq]

	    
	}
	console.log(change);
	return [null, index]
    }while(change)

    
}


//это от лени, можно было бы и 3 байтов дождаться но тогда надо было бы отматывать назад
function hack_empty_success(rule,  tmp){
    //console.log(rule, tmp);
    return Buffer.compare(rule, tmp);
};

function addToTmpBuf(tmp, b){
    return Buffer.concat([tmp, Buffer.from([b])]);

}

//console.log(parse(0, Buffer.from(working_examples[5])));
console.log(parse(0, Buffer.from(working_examples[5])));
