import {csv_async_generator} from "../lib/worker/csv_async_generator.js"


async function test_generator(){
    for await (const cassete of csv_async_generator()){
	console.log(cassete);
    }
}

test_generator();
