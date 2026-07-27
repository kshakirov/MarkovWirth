console.log("Markov byte automaton");
import {Buffer} from "node:buffer";

let working_examples  = [`ze"""ro me why you lied to me""" ",`,
			 `first me why  you lied to me " ,`,
			 `sec me why """, you lied to me""" ",`,
		 	 `FOURTH me why `,
			 `third me why """, you lied to me """ ",`,
			 `",`,
			 `"""3""" "`,
			 `" ,`];


const rules = [
    [Buffer.from([0x22,0x22,0x22]), Buffer.from([0x01,0x22,0x22])],
    [Buffer.from([0x01,0x22,0x22]), Buffer.from([0x01,0x02,0x22])],
    [Buffer.from([0x01,0x02,0x22]), Buffer.from([0x01,0x02,0x3])],
    [Buffer.from([0x22,0x20,0x22]) ,Buffer.from([0x01,0x01,0x1])],
    [Buffer.from([0x3,0x20,0x22]) ,Buffer.from([0x01,0x01,0x1])],
    [Buffer.from([0x22,0x22]), Buffer.from([0x03,0x03,0x3])],
]


const empty_rule = Buffer.from([0x22,0x2c]);




function parse(index, buffer){
    let buffer_length = buffer.length;
    let change = false;
    let tmp = Buffer.alloc(2);
    console.log(`buffer is ${buffer}`);
    console.log(buffer);

    //checking first 2 bytes ", this one
    let n = buffer.copy(tmp,0,index,2);
    console.log(n);
    let match = hack_empty_success(empty_rule, tmp)
    if(match){
	console.log("Success: Empty String");
	return [index, index + 2];
    }else{
	console.log("Working furhter");
    }

    for (let i = 0; i < 16; i + 16 ){
	if(i + 16 > buffer_length){
	    tmp = Buffer.alloc(buffer_length);
	    console.log("Buffer length is " + buffer_length);
	    n = buffer.copy(tmp,0,index,buffer_length);
	    console.log(tmp)
	    
	}else {
	    tmp = Buffer.concat([tmp, Buffer.alloc(i + 16)]);
	    n = buffer.copy(tmp,2,index,16);
	}
	if(n==0){
	    console.log("Can't copy, exitint ...");
	    return 
	}
	outer_loop: do {
	   // console.log("Again in outer loop after match")
	    loop: for (let r of rules){
		let [match, offset] = cmpTmpToRule(tmp,r[0]);
		if(match){
		    console.log(`Found the rule, offset ${offset}`)
		    console.log(tmp);
		    console.log("tmp from cmp")
		    tmp = reInPlaceTmpByRule(tmp, offset,r[1]);
		    console.log(`tmp after replacement , jumping to outer loop`);
		    console.log(tmp);
		    change = true
		    continue outer_loop;
		}
		if(false){
		    //здесь помяню на новый 
		    return [false, seq];
		}
		else if(false)
		    //	    else if(seq.slice(-7)=="THE_END")
		    //console.log(seq);
		    return [true, seq]

		
	    }
	    
	}while(change);
	
    }

        
}


//это от лени, можно было бы и 3 байтов дождаться но тогда надо было бы отматывать назад
function hack_empty_success(rule, tmp){
    console.log(rule, tmp);
    return Buffer.compare(rule, tmp) == 0;

};

function addToTmpBuf(tmp, b){
     return Buffer.concat([tmp, Buffer.from([b])]);

}

function cmpTmpToRule(tmp, rule){
    // console.log("cmpToRule");
    //    console.log(tmp, rule);
    const len = tmp.length;
    for(let i = 0;i <= len - rule.length;i++){
	if(Buffer.compare(rule, tmp.subarray(i, i + rule.length)) == 0){
	    
	    return [true, i];
	}
    }
    return [false, null];
}

function reInPlaceTmpByRule(tmp,offset, rule){
    console.log(tmp, offset, rule, rule.length)
//    if(offset==0){
//	return Buffer.concat([rule,tmp.subarray(offset + rule.length +1 )]);
//    }
    return Buffer.concat([tmp.subarray(0,offset),rule,tmp.subarray(offset + rule.length)]);
    //rule.copy(tmp,offset,0,2);
    //console.log(tmp);
}


//console.log(parse(0, Buffer.from(working_examples[5])));
console.log(parse(0, Buffer.from(working_examples[6])));
//console.log(parse(0, Buffer.from(working_examples[7])));
let r = reInPlaceTmpByRule(Buffer.from([0x22,0x22,0x22,0x33,0x22,0x22,0x22,0x22]), 0, Buffer.from([0x01,0x22,0x22]));
console.log(r)

let r2 = reInPlaceTmpByRule(r, 0, Buffer.from([0x01,0x2,0x22]));
console.log(r2)
