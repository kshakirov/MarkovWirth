import { WirthMarkovFSM } from "../lib/parser/wirth_markov_fsm.js";
import { Buffer } from "node:buffer";

// Набор безопасных символов для текста ячеек
function genRandomText(len) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let res = "";
    for (let i = 0; i < len; i++) {
        res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
}

/**
 * ГЕНЕРАТОР: 3 ячейки в строке с комбинацией от 0 до 3 экранированных полей
 */
function generate3CellComboRow() {
    // Выбираем, сколько ячеек из 3 будут экранированными (от 0 до 3)
    const escapedCount = Math.floor(Math.random() * 4); // 0, 1, 2 или 3
    
    // Массив флагов для 3 ячеек: true = escaped, false = unescaped
    const isEscaped = [false, false, false];
    
    // Рандомно распределяем escaped-статусы по 3 ячейкам
    let assigned = 0;
    while (assigned < escapedCount) {
        const idx = Math.floor(Math.random() * 3);
        if (!isEscaped[idx]) {
            isEscaped[idx] = true;
            assigned++;
        }
    }

    const expectedRow = []; // Чистые данные (эталонная матрица)
    const csvTokens = [];   // Сформированные CSV-токены

    for (let i = 0; i < 3; i++) {
        const baseText = genRandomText(Math.floor(Math.random() * 6) + 1);
	//console.log(baseText)
        if (isEscaped[i]) {
            // Экранированная ячейка: генерируем внутри от 1 до 3 пар кавычек ""
            const quotePairs = Math.floor(Math.random() * 3) + 1; // 1..3 пар
            
            // Чистое значение (как его должен увидеть парсер после декодинга)
            const rawValue = baseText + '"'.repeat(quotePairs) + "end";
            expectedRow.push(rawValue);

            // RFC-4180 CSV токен: дублируем внутренние кавычки и оборачиваем в внешние ""
            const escapedCsvToken = `"${baseText}${'""'.repeat(quotePairs)}end"`;
            csvTokens.push(escapedCsvToken);
        } else {
            // Неэкранированная ячейка (простые байты без спецсимволов)
            expectedRow.push(baseText);
            csvTokens.push(baseText);
        }
    }

    // Собираем строковый CSV-патрон с разделителями-запятыми и переносом строки \n
    const csvLine = csvTokens.join(",") + "\n";

    return {
        buffer: Buffer.from(csvLine),
        expectedRow: expectedRow
    };
}

/**
 * ТЕСТОВЫЙ РАННЕР COMBINATORIAL MATRIX
 */
function run3CellCombinatorialPbt(iterations = 1) {
    console.log(`\n================================================================`);
    console.log(`[START] Запуск комбинаторного PBT (3 ячейки, микс 0..3 escaped)...`);
    console.log(`[INFO] Объем прогона: ${iterations} итераций.`);
    console.log(`================================================================\n`);

    let passed = 0;

    for (let t = 0; t < iterations; t++) {
        const { buffer, expectedRow } = generate3CellComboRow();
	//console.log(`${buffer}`);

        let bufferIndex = 0,
            itable = new Int32Array(256),
            itableIndex = 0,
            parserState = 5;

        // Почанковый прогон (проверяем FSM на срез по 1 байту)
        for (let i = 1; i <= buffer.length; i++) {
            [parserState, bufferIndex, itable, itableIndex] = 
                WirthMarkovFSM(buffer.subarray(0, i), bufferIndex, itable, itableIndex, parserState);
        }

        // 1. Проверка структуры itable (должно быть 3 ячейки = 6 офсетов + 1 сентинел -1 = 7 элементов)
        if (itableIndex !== 7 || itable[6] !== -1) {
            console.error(`🚨 [КАТАСТРОФА] Сбой структуры itable на итерации #${t}!`);
            console.error(`[ОЖИДАЛАСЬ МАТРИЦА]:`, expectedRow);
            console.error(`[СЫРОЙ CSV]: ${buffer.toString('utf-8')}`);
            console.error(`[ITABLE INDEX]: ${itableIndex}, [ITABLE]:`, itable.subarray(0, itableIndex));
            process.exit(1);
        }

        // 2. Сверка содержимого ячеек из itable с expectedRow (байтовый roundtrip)
        for (let cellIdx = 0; cellIdx < 3; cellIdx++) {
            const start = itable[cellIdx * 2];
            const end = itable[cellIdx * 2 + 1];
            
            // Получаем сырой срез из буфера по офсетам
            const rawSlice = buffer.subarray(start, end).toString('utf-8');

            // Очищаем внешние кавычки и системные демаскированные токены
            let parsedValue = rawSlice;
            if (parsedValue.startsWith('"') && parsedValue.endsWith('"')) {
                parsedValue = parsedValue.slice(1, -1).replace(/""/g, '"');
            }

            if (parsedValue !== expectedRow[cellIdx]) {
                console.error(`🚨 [КАТАСТРОФА] Несовпадение данных в ячейке [${cellIdx}]!`);
                console.error(`[ОЖИДАЛОСЬ]: "${expectedRow[cellIdx]}"`);
                console.error(`[ПОЛУЧЕНО]:  "${parsedValue}"`);
                console.error(`[СЫРОЙ CSV]: ${buffer.toString('utf-8')}`);
                process.exit(1);
            }
        }

        passed++;
    }

    console.log(`================================================================`);
    console.log(`✅ [УСПЕХ] Все ${passed} комбинаторных итераций пройдены без единого сбоя!`);
    console.log(`================================================================\n`);
}

run3CellCombinatorialPbt(10000);
