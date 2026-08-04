
import {Buffer} from "node:buffer";



const rules = [
    [Buffer.from([0x22,0x22]), Buffer.from([0x01,0x2])],
    [Buffer.from([0x22,0x2C]) ,Buffer.from([0x03,0x3])],
    [Buffer.from([0x22]) ,Buffer.from([0x04])]

]


const empty_rule = Buffer.from([0x22,0x2c]);




export function MarkovEngine(index, buffer){
    let buffer_length = buffer.length;
    let capacity = 256
    let buffer_head = 1,
	buffer_tail =0;
    
    let change = false;
    let tmp = Buffer.alloc(2);
//    console.log(`index is ${index} buffer is ${buffer}`);
//    console.log(buffer);

    //checking first 2 bytes ", this one
    let n = buffer.copy(tmp,0,index, index + 2);
    //console.log(n);
    let match = hack_empty_success(empty_rule, tmp)
    if(match){
	//console.log("Success: Empty String");
	return [index, index + 2];
    }else{
	//console.log("Working furhter");
	tmp = Buffer.alloc(capacity);
    }


    for (let i = 0; i < capacity; i += 16 ){
	let start_index = i === 0 ? 0 : i - 1;

	//console.log(`new cycle i = ${i}`)
	if(i + 16 > buffer_length){
	    
	    //tmp = Buffer.alloc(buffer_length);
	    buffer_tail = buffer_length
	    //console.log("Buffer length is " + buffer_length);
	    n = buffer.copy(tmp,0,index,buffer_length);
	    //console.log(tmp)
	    
	}else {
	   
	    if(i + 16 < buffer_length){
		//tmp = Buffer.concat([tmp, Buffer.alloc(i + 16)]);
		n = buffer.copy(tmp,i,index + i, index + i + 16);
		buffer_tail =  i + n;
		//oldLength = buffer_tail
		//console.log(oldLength)
	    }else {
		let limit = buffer_length;
		//tmp = Buffer.concat([tmp, Buffer.alloc(limit)]);
		//console.log(oldLength);
		n = buffer.copy(tmp,i,index + 1, limit);
		buffer_tail = n;
	    }
	    //console.log(tmp)
	    //console.log(buffer_head)
	    //console.log(buffer_tail)
	}
	if(n==0){
	    //console.log("Can't copy, exiting ...");
	    return [false, 0] 
	}
	outer_loop: do {
	    change = false;
	   // console.log("Again in outer loop after match")
	    loop: for (let r of rules){
		let [match, offset] = cmpTmpToRule(tmp,r[0], buffer_tail, start_index);
		if(match){
		    //console.log(`Found the rule, offset ${offset} rule ${r[0]}` + r[0])
		    //console.log(tmp);
		    //console.log("tmp from cmp")
		    reInPlaceTmpByRule(tmp, offset,r[1]);
		    if(r[0].length == 1 && offset < buffer_tail - 1){
		//	console.log(`Last rule ${offset} ${tmp.length} ${i} ${tmp}`)
		//	console.log(tmp);
			//console.log(offset);
			return [false, offset, buffer.subarray(index, offset)];
		    }else if(r[1][0]==0x03){
		//	console.log("Finish");
			return [true, index  + offset + 1, buffer.subarray(index, index + offset + 1)]

			//console.log(`tmp after replacement , jumping to outer loop`);
			//console.log(tmp);
		    }
		    change = true
		    continue outer_loop;
		}
		
		if(hack_end_success(tmp)){
		    //	    elise if(seq.slice(-7)=="THE_END")
		    //here will be the check from the end of the bytes seq but for now just last two bytes from the end
		    
		    return [true, index  + tmp.length, buffer.subarray(index, index + tmp.length)]
		}
		// if(!change){
		//     //здесь помяню на новый
		//     console.log("NOT CHANGED");
		//     //return [false, index, index + tmp.length];
		// }

		
	    }
	    
	}while(change);
	
    }
//    console.log("nothing found");
    return [false,capacity , tmp]//if more than 128 bytes allowed in config in prod it will be greater but anyway finite

        
}


//это от лени, можно было бы и 3 байтов дождаться но тогда надо было бы отматывать назад
function hack_empty_success(rule, tmp){
    //console.log(rule, tmp);
    return Buffer.compare(rule, tmp) == 0;

};

// function addToTmpBuf(tmp, b){
//      return Buffer.concat([tmp, Buffer.from([b])]);

// }

function hack_end_success(tmp){
    let length = tmp.length;
    let end = tmp.subarray(length - 2, length);
    return Buffer.compare(end, Buffer.from([0x03,0x3])) == 0;
}

function cmpTmpToRule(tmp, rule, buffer_tail, start_index){
   // console.log(rule);
   // console.log(tmp);
    const len = tmp.length;
    for(let i = start_index;i <= buffer_tail  - rule.length;i++){
	if(Buffer.compare(rule, tmp.subarray(i, i + rule.length)) == 0){
	    
	    return [true, i];
	}
    }
    return [false, null];
}

function reInPlaceTmpByRule(tmp,offset, rule){
    //console.log(tmp, offset, rule, rule.length)
    rule.copy(tmp, offset,0,rule.length);
    //return Buffer.concat([tmp.subarray(0,offset),rule,tmp.subarray(offset + rule.length)]);
}


