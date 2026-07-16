import {MarkovEngine} from "./parse_escaped.js"


let working_examples  = [`zero me why """you lied to me""" ",`,
			 `first me why  you lied to me " ,`,
			 `sec me why """, you lied to me""" ",`,
		 	 `FOURTH me why `,
			 `third me why """, you lied to me """ ",`];


for (let ex of working_examples){
    let [b, orig] = MarkovEngine(ex)
    if(b){
	console.log(`Succeeded for ${orig} `);
    }else if (b==null) {
	console.log(`Not yet processed   for ${orig} `);
    }
    else {
	console.log(`Failed  for ${orig} `);
    }
}


