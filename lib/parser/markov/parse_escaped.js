console.log("Working with Markov");

const example = `tell me why """ you lied to me""" "`;

let working_example = `tell me why """ you lied to me""" ",`;



const rules = [
    [/"""/, `!!!""`],
    [/!!!""/, `!!!#"`],
    [/!!!#"/, "!!!#???"],
    [/",/, "THE_END"]
    ]

const finished =  false;
const error  = false;

let counter = 20;





for (let rule of rules){
    
	while (rule[0].test(working_example)){
	    working_example = working_example.replace(rule[0], rule[1]);
	    console.log("Changed");
	    console.log(working_example);
	}
    console.log("it's finished for this rule");
}



