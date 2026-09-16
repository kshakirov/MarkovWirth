import { Worker } from 'worker_threads';

const w = new Worker('./lib/worker/worker.js', { workerData: { n: 42 } });

const fileName = "/home/kshakirov/Documents/resources/london_crime_by_lsoa.csv";

w.postMessage({fileName: fileName });
w.on('message', (msg) => console.log('from worker:', msg));
w.on('error', (e) => console.error(e));
w.on('exit', (code) => console.log('exit', code));


