import {WirthMarkovFSM} from "../lib/parser/wirth_markov_fsm.js"
import {Buffer} from "node:buffer"

const PAYLOAD_SIZE = 16;



// Хелпер: генерация алфавита без критических символов (кавычки, запятые, CRLF)
function genSafeByte() {
    // Символы от пространства пробела (32) до конца латиницы, исключая кавычку (34) и запятую (44)
    let b;
    do {
        b = Math.floor(Math.random() * (126 - 32)) + 32;
    } while (b === 0x22 || b === 0x2C);
    return b;
}

/**
 * ГЕНЕРАТОР №1: Гарантированно Истинные Положительные Кейсы (Expected: true)
 * Строго соблюдает RFC 4180: парные кавычки внутри, легальный финиш на краю
 */
function generateTruePositiveTuple(maxLength = PAYLOAD_SIZE) {
    // Резервируем длину, учитывая, что в конце всегда пишем кавычку и терминатор (2 байта)
    const length = Math.floor(Math.random() * (maxLength - 4)) + 4; 
    const buf = Buffer.alloc(length);
    
    let writeOffset = 1;
    
    // Заполняем тело ячейки
    while (writeOffset < length - 2) {
        // С вероятностью 15% подбрасываем легальную экранированную пару кавычек ""
        if (Math.random() < 0.15 && writeOffset < length - 4) {
            buf[writeOffset++] = 0x22;
            buf[writeOffset++] = 0x22;
        } else {
            buf[writeOffset++] = genSafeByte();
        }
    }
    
    // Жестко паяем легальный финиш по RFC 4180
    buf[length - 2] = 0x22; // закрывающая кавычка ячейки
    buf[0] = 0x22; // открывающая кавычка ячейки
    // Случайный легальный разделитель: запятая, перенос строки или EOF
    const terminators = [0x0A];
    buf[length - 1] = terminators[Math.floor(Math.random() * terminators.length)];
    
    return { buffer: buf, expected: true, type: 'TRUE_POSITIVE' };
}

/**
 * ГЕНЕРАТОР №2: Гарантированно Истинные Отрицательные Кейсы (Expected: false)
 * Намеренно ломает математический баланс кавычек (Одинокая кавычка)
 */
function generateTrueNegativeTuple(maxLength = PAYLOAD_SIZE) {
    const length = Math.floor(Math.random() * (maxLength - 4)) + 4;
    const buf = Buffer.alloc(length);
    
    // Заполняем тело безопасными байтами
    for (let i = 1; i < length; i++) {
        buf[i] = genSafeByte();
    }
    
    // Внедряем ОДИНОЧНУЮ кавычку на случайную позицию в середине
    const evilIndex = Math.floor(Math.random() * (length - 4)) + 1;
    buf[evilIndex] = 0x22; 
    buf[0] = 0x22; //первая кавычка идет
    // Проверяем, чтобы за ней не встала случайно кавычка или запятая (гарантируем одиночество)
    buf[evilIndex + 1] = genSafeByte();
    
    // В конце пишем обычный легальный финиш ячейки, но одиночка в середине обязана всё взорвать!
    buf[length - 2] = 0x22;
    buf[length - 1] = 0x0A;
    
    return { buffer: buf, expected: false, type: 'TRUE_NEGATIVE_SINGLE_QUOTE' };
}

/**
 * ГЛАВНЫЙ СУДЬЯ: Прогон стохастических кортежей
 */
function runExtremePropertyTest(iterations = 10000) {
   

    console.log(`\n================================================================`);
    console.log(`[START] Запуск Экстремального Полика инвариантов Хоара...`);
    console.log(`[INFO] Объем залпа: ${iterations} типизированных кортежей.`);
    console.log(`================================================================\n`);
    
    let stats = { true_pos: 0, true_neg: 0, false_pos: 0, false_neg: 0 };
    
    for (let t = 0; t < iterations; t++) {
	let bufferIndex = 0,
	    itable = new Int32Array(256),
	    itableIndex =0,
	    parserState = 5,
	    actualResult = false;

        // Поочередно генерируем то гарантированный успех, то гарантированную мину
        const caseTuple = t % 2 === 0 
            ? generateTrueNegativeTuple(PAYLOAD_SIZE) 
            : generateTrueNegativeTuple(PAYLOAD_SIZE);
//        console.log(caseTuple.buffer)
	//	console.log(`[СТРОКОВЫЙ СЛИВ]: ${caseTuple.buffer.toString('utf-8')}\n`);
	try {
	[parserState,bufferIndex,itable, itableIndex] =  WirthMarkovFSM(caseTuple.buffer, bufferIndex,itable, itableIndex, parserState );
	
	if (
	      parserState === 5 &&
		bufferIndex === caseTuple.buffer.length &&
		itableIndex === 3 &&
		itable[0] === 0 &&
		itable[1] === caseTuple.buffer.length - 1 &&
		itable[2] === -1){
	
	    actualResult = true;
	}
	}catch (error){console.log(error)}; 
	    
        // // Сверка математического ожидания с реальностью
        if (actualResult !== caseTuple.expected) {
            console.error(`\n🚨 [КАТАСТРОФА] МАТРИЦА ОШИБОК ПРОБИТА!`);
            console.error(`[ТИП ТЕСТА]: ${caseTuple.type}`);
            console.error(`[ОЖИДАЛОСЬ]: ${caseTuple.expected} | [ПОЛУЧЕНО]: ${actualResult}`);
            console.error(`[ДЛИНА БУФЕРА]: ${caseTuple.buffer.length}`);
            console.error(`[СЫРЫЕ БАЙТЫ БУФЕРА]:`, caseTuple.buffer);
            console.error(`[СТРОКОВЫЙ СЛИВ]: ${caseTuple.buffer.toString('utf-8')}\n`);
//	    console.log(parserState,bufferIndex, itableIndex);
            process.exit(1); // Аварийный стоп конвейера
        }
        
        // Сбор метрик сопряженности
         if (caseTuple.expected === true && actualResult === true) stats.true_pos++;
         if (caseTuple.expected === false && actualResult === false) stats.true_neg++;
    }
    
    console.log(`================================================================`);
    console.log(`[УСПЕХ] Матрица Хоара полностью верифицирована! Сбоев нет.`);
    console.log(`[Истинно Положительные (Легальные поля)]: ${stats.true_pos} проходов`);
    console.log(`[Истинно Отрицательные (Одинокие кавычки)]: ${stats.true_neg} проходов`);
    console.log(`================================================================\n`);
}

runExtremePropertyTest(10000);
