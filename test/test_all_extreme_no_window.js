// ... (склеить с Чанк 2)

import { MarkovEngine } from '../lib/parser/markov/parse_escaped_byte_no_window.js'




// Хелпер: генерация безопасного байта
function genSafeByte() {
    let b;
    do {
        b = Math.floor(Math.random() * (126 - 32)) + 32;
    } while (b === 0x22 || b === 0x2C);
    return b;
}

/**
 * ГЕНЕРАТОР: Положительные Кейсы (RFC 4180)
 * Создает буфер, начинающийся и заканчивающийся кавычкой.
 */
function generateTruePositiveTuple(maxLength = 256) {
    const length = Math.floor(Math.random() * (maxLength - 4)) + 4;
    const buf = Buffer.alloc(length);
    let writeOffset = 0;

    //buf[writeOffset++] = 0x22; // Открывающая кавычка

    // Заполнение тела с экранированием
    while (writeOffset < length - 2) {
        if (Math.random() < 0.15 && writeOffset < length - 3) {
            buf[writeOffset++] = 0x22;
            buf[writeOffset++] = 0x22;
        } else {
            buf[writeOffset++] = genSafeByte();
        }
    }

    buf[length - 2] = 0x22; // Закрывающая кавычка
    buf[length - 1] = 0x2C; // Разделитель

    return { buffer: buf, expected: true, type: 'TRUE_POSITIVE' };
}

/**
 * ГЕНЕРАТОР: Отрицательные Кейсы (Одинокая кавычка)
 * Создает буферы с нарушенным балансом кавычек.
 */
function generateTrueNegativeTuple(maxLength = 256) {
    const length = Math.floor(Math.random() * (maxLength - 5)) + 5;
    const buf = Buffer.alloc(length);
    
    // Внедряем умышленную ошибку (одиночная кавычка)
    //buf[0] = 0x22; 
    const evilIndex = Math.floor(Math.random() * (length - 4)) + 2;
    buf[evilIndex] = 0x22;
    buf[length - 2] = 0x22;
    buf[length - 1] = 0x2C;

    return { buffer: buf, expected: false, type: 'TRUE_NEGATIVE_SINGLE_QUOTE' };
}

/**
 * ГЛАВНЫЙ СУДЬЯ: Прогон 10 000 итераций без оконного сдвига
 * Тестирует генерацию с чередованием позитивных и негативных кейсов.
 */
function runExtremeNoWindowTest(iterations = 10000) {
    // ... логика теста аналогична предыдущей, с вызовом parseEscapedByteNoWindow ...
    // В случае ошибки выводится дамп и завершается процесс.
    for (let i =0; i< iterations; i++){
	
//	let test =   generateTruePositiveTuple();
	let test =   generateTrueNegativeTuple(16);
	
	console.log(i, test.buffer.length);
	console.log(test);
	let [result, a, b] = MarkovEngine(0, test.buffer);
	if(result != test.expected){
	    console.log("Doesnt work")
	}
    }
    //console.log(result);
}

runExtremeNoWindowTest(1);
// Хелпер: безопасные байты (исключая ", ,, \n, \r)
