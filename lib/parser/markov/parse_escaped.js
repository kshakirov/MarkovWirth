console.log("Working with Markov");

const example = `tell me why """, you lied to me""" " ,`;

let working_examples  = [`zero me why """you lied to me""" ",`,
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
    seq = parse(seq);
    console.log(`\t Finished ${seq}`);
    //console.log(seq.slice(-7));
    if(seq.slice(-7)=="THE_ERROR")
	return [false, orig];
    else
	return [true, orig]
}

function parse(seq){
    for (let rule of rules){
	//console.log(rule);
	while (rule[0].test(seq)){
	    seq = seq.replace(rule[0], rule[1]);
	    //console.log(`\t ${seq}`)
	    
	}

    }
    return seq;
}


for (let ex of working_examples){
    let [b, orig] = MarkovEngine(ex)
    if(b){
	console.log(`Succeeded for ${orig} `);
    }else{
	console.log(`Failed  for ${orig} `);
    }
}

//console.log(parse(example));



