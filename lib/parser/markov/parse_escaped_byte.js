console.log("Markov byte automaton");
import {Buffer} from "node:buffer";

let working_examples  = [`zero me why """you lied to me""" ",`,
			 `first me why  you lied to me " ,`,
			 `sec me why """, you lied to me""" ",`,
		 	 `FOURTH me why `,
			 `third me why """, you lied to me """ ",`];


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
	//console.log(seq);
	change = false;
	loop: for (let r of rules){
	    if(tmp.length < 2){
		current_index += 1;
		continue;
	    }
	    if(tmp.length==2){
		
	    }
	    
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
	return [null, seq]
    }while(change)

    
}


