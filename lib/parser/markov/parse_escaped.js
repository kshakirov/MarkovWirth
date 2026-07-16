
let working_examples  = [`zero me why """"you lied to me""" ",`,
			 `first me why  you lied to me " ,`,
			 `sec me why """, you lied to me""" ",`,
			 `third me why """, you lied to me """ ",`];


//change to unicod symbols from the highest ones
const rules = [
    [/"""/, `!!!""`],
    [/!!!""/, `!!!#"`],
    [/!!!#"/, "!!!#???"],
    [/" ,$/, "THE_ERROR"],
    [/",$/, "THE_END"],
]


function MarkovEngine (orig){
    let seq = orig;
    let [result, t_seq] = parse(seq);
    console.log(`\t Parsed ${t_seq}`);
    return [result,orig] ;
}

function parse(orig){
    let seq = orig;
    outer_loop: while (true){
	//console.log(seq);
	loop: for (let r of rules){
	    if(r[0].test(seq)){
		seq = seq.replace(r[0], r[1]);
		
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
    }

    
}


for (let ex of working_examples){
    let [b, orig] = MarkovEngine(ex)
    if(b){
	console.log(`Succeeded for ${orig} `);
    }else{
	console.log(`Failed  for ${orig} `);
    }
}





//console.log(parse(working_examples[0]));
