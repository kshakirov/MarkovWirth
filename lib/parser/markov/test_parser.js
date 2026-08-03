import {MarkovEngine} from "./parse_escaped_byte.js"


//let working_examples  = [`zero me why ""you lied to me"" ",`,]
let working_examples  = [`zero me why ""you lied to me"" ",`,
			 `first me why  you lied to me ",`,
			 `sec me why "", you lied to me"" ",`,
		 	 `FOURTH me why",`,
			 `""3"" ",`,
			 `""3""",`,
			 `third me why "", you lied to me "" ",`,
			 `hi, there " `,
			 `very long text 1 2 3 4 5 5 6 6 7 too long "" tell me "", 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 ",`
			];


for (let ex of working_examples){
    let [b, index, buffer] = MarkovEngine(0, Buffer.from(ex))
    if(b){
	//console.log(`Succeeded for ${ex} length is ${index} buffer is ${buffer}`);
	console.log(`Succeeded for ${ex} length is ${index}`);
    }else if (b==null) {
	console.log(`Not yet processed   for ${ex} `);
    }
    else {
	console.log(`Failed  for ${ex} index ${index} `);
    }
}


