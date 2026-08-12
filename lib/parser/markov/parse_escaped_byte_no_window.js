
import {Buffer} from "node:buffer";



const rules = [
    
    [Buffer.from([0x22,0x22,0x22,0x2C]), Buffer.from([])],
    [Buffer.from([0x22,0x22,0x22,0x0A]), Buffer.from([])],
    [Buffer.from([0x22,0x22]), Buffer.from([0x01,0x2])],
    [Buffer.from([0x22,0x2C]) ,Buffer.from([0xFF,0xFF])],
    [Buffer.from([0x22]) ,Buffer.from([0x04])],
    [Buffer.from([0xFF,0xFF]) ,Buffer.from([0x03, 0x03])]

]



export function MarkovEngine(index, buffer){
    let buffer_length = buffer.length,
	capacity = 256,
	buffer_tail =0;
    
    let change = false;
    let n = 0;
    let tmp = Buffer.alloc(capacity);
    let start_index =0
    n = buffer.copy(tmp,0,index, index + buffer_length);
    buffer_tail = buffer_length;


    outer_loop: do {
	change = false;
	loop: for (let r of rules){
	    let [match, offset] = cmpTmpToRule(tmp,r[0], buffer_tail, start_index);
	    if(match){
		if(r[0].length === 4){
		    //console.log(`${offset}, ${index  + offset + 4}`)
		    if(r[0][3]===0x2C){
			return [true, index  + offset + 4, buffer.subarray(index - 1, index + offset + 4)]
		    }else {
			return [true, index  + offset + 3, buffer.subarray(index - 1, index + offset + 3)]
		    }
		}
		else if(r[0].length == 1 ){
		    return [false, offset, buffer.subarray(index - 1, offset)];
		}else if(r[1][0]==0x03){

		    return [true, index  + offset + 1, buffer.subarray(index -1, index + offset + 1)]

		}else{
		    reInPlaceTmpByRule(tmp, offset,r[1]);
		    change = true;
		    continue outer_loop;
		}
	    }
	}
	
    }while(change);
    
    return [false,capacity , tmp]//if more than 128 bytes allowed in config in prod it will be greater but anyway finite

    
}


function cmpTmpToRule(tmp, rule, buffer_tail, start_index){

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


