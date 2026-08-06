
import {Buffer} from "node:buffer";



const rules = [
    [Buffer.from([0x22,0x22]), Buffer.from([0x01,0x2])],
    [Buffer.from([0x22,0x2C]) ,Buffer.from([0x03,0x3])],
    [Buffer.from([0x22]) ,Buffer.from([0x04])]

]







export function MarkovEngine(index, buffer){
    let buffer_length = buffer.length;
    let capacity = 256
    let buffer_head = 1,
	buffer_tail =0;
    
    let change = false;
    let n = 0;
    let tmp = Buffer.alloc(capacity);


    for (let i = 0; i < capacity; i += 16 ){
	let start_index = i === 0 ? 0 : i - 1;

	//we passes through the whole buffer
	if(i  > buffer_length){
	    return [false,buffer_length , tmp]
	    
	};
	
	if(i + 16 < buffer_length){
	
	    n = buffer.copy(tmp,i,index + i, index + i + 16);
	    buffer_tail =  i + n;
	
	    
	}else {
	    let limit = buffer_length - i;
	
	    n = buffer.copy(tmp,i,index + i, index + i + limit);
	    buffer_tail = n + i;
	    
	
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
//		    let true_change = false; 

 		    // if(r[0].length == 1 && buffer_tail - 1 != offset){
		    // 	reInPlaceTmpByRule(tmp, offset,r[1]);
		    // 	true_change = true;
		    // }
		    if(r[0].length == 1 && offset < buffer_tail - 1){
			console.log(`Last rule ${offset} ${tmp.length} ${i} ${tmp}`)
			return [false, offset, buffer.subarray(index, offset)];
		    }else if(r[1][0]==0x03){
			console.log(`Final Rule`);
			return [true, index  + offset + 1, buffer.subarray(index, index + offset + 1)]

		    }else{
			reInPlaceTmpByRule(tmp, offset,r[1]);
			continue outer_loop;
		    }
		    if(true_change){
			change = true
			continue outer_loop;
		    }
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
    //    const len = tmp.length;
    for(let i = start_index;i <= buffer_tail  - rule.length;i++){
	//console.log(`start_index ${start_index}, tail ${buffer_tail} tmp subarray to compare ${tmp.subarray(i, i + rule.length)} rule ${rule}, i = ${i} байты [${tmp[i]}],[${tmp[i + rule.length]}]`);
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


