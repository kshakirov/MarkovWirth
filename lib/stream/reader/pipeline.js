import fs  from 'node:fs'

import { Transform } from 'node:stream'


function createCsvReadStream(fileName){
    const reader = fs.createReadStream(fileName);
    const transformer = "";
//    const writer = fs.createWriteStream(process.stdout);
    reader.pipe(process.stdout);
    
}

createCsvReadStream("package.json");
