import {MarkovEngine} from "./parse_escaped_byte.js"


let working_examples  = [`zero me why ""you lied to me"" ",`,
			 `first me why  you lied to me ",`,
			 `sec me why "", you lied to me"" ",`,
		 	 `FOURTH me why",`,
			 `third me why "", you lied to me "" ",`];


for (let ex of working_examples){
    let [b, orig] = MarkovEngine(0, Buffer.from(ex))
    if(b){
	console.log(`Succeeded for ${ex} `);
    }else if (b==null) {
	console.log(`Not yet processed   for ${ex} `);
    }
    else {
	console.log(`Failed  for ${ex} `);
    }
}


