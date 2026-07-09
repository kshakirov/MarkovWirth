


//change to unicod symbols from the highest ones
const rules = [
    [/"""/, `!!!""`],
    [/!!!""/, `!!!#"`],
    [/!!!#"/, "!!!#???"],
    [/" ,$/, "THE_ERROR"],
    [/",$/, "THE_END"],
]


export function MarkovEngine (orig){
    let seq = orig;
    let [result, t_seq] = parse(seq);
    console.log(`\t Parsed ${t_seq}`);
    return [result,orig] ;
}

function parse(orig){
    let seq = orig;
    let change = false;
    outer_loop: do {
	//console.log(seq);
	change = false;
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
	return [null, seq]
    }while(change)

    
}




//console.log(parse(working_examples[0]));
