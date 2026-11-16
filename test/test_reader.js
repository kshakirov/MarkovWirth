import { WirthMarkovCsvReader} from "../lib/stream/reader/csv_reader.js";



console.log("testing");


const csv_reader =  new WirthMarkovCsvReader("/home/kshakirov/Documents/resources/test_4_buffers.csv");
console.log(csv_reader);
csv_reader.on('data', (chunk)=> {
    console.log(chunk);
				})
