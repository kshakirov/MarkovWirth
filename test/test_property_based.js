import { MarkovEngine } from '../lib/parser/markov/parse_escaped_byte_no_window.js'

// Генератор случайного буфера заданной длины и структуры
function generateStochasticBuffer(length, type = 'chaos') {
    const buf = Buffer.alloc(length);
    for (let i = 0; i < length; i++) {
        if (type === 'storm') {
            // Генерируем критические для Маркова байты: кавычки, запятые, пробелы, перенос строки
            const tokens = [0x22, 0x22, 0x22, 0x2C, 0x20, 0x0A, 0x41]; 
            buf[i] = tokens[Math.floor(Math.random() * tokens.length)];
        } else {
            // Абсолютно случайный байт
            buf[i] = Math.floor(Math.random() * 256);
        }
    }
    return buf;
}


// Постусловие Хоара: Верификатор инвариантов ядра
function verifyMarkovProperties(iterations = 5000) {
    console.log(`[START] Запуск Property-Based Testing для Марковского спецназа (${iterations} тактов)...`);
    
    for (let t = 0; t < iterations; t++) {
        // Чередуем абсолютный хаос и структурный шторм кавычек
        const type = t % 2 === 0 ? 'chaos' : 'storm';
        const testLength = Math.floor(Math.random() * 200) + 1; // длины от 1 до 200 байт
        const buffer = generateStochasticBuffer(testLength, type);
        const startIndex = 0; // Начинаем с нуля для чистой изоляции
        
        // Переменные контроля проблемы останова (Watchdog)
        let startTime = performance.now();
        
        // Вызов нашего оракула
        let result = MarkovEngine(startIndex, buffer);
        
        let duration = performance.now() - startTime;
        
        // ИНВАРИАНТ 1: Защита от бесконечного цикла (Решение проблемы останова на практике)
        if (duration > 50) { // Если функция думает дольше 50мс на 200 байтах — это зависание конвейера!
            console.error(`[CRITICAL] Обнаружено зависание (Бесконечный цикл НАМ)! Буфер:`, buffer);
            process.exit(1);
        }
        
        const [success, nextIndex, resTmp] = result;
        
        // ИНВАРИАНТ 2: Монотонность указателя памяти по Вирту
        if (success && nextIndex <= startIndex) {
            console.error(`[ERROR] Нарушение монотонности: nextIndex (${nextIndex}) не двинулся вперед относительно startIndex (${startIndex})`);
            process.exit(1);
        }
        
        // ИНВАРИАНТ 3: Защита границ кассеты (Емкость 128 байт)
        if (nextIndex > startIndex + 128 && success) {
            console.error(`[ERROR] Нарушена граница безопасности кассеты! Поле длиннее 128 байт пропущено без ошибки.`);
            process.exit(1);
        }
    }
    
    console.log(`[SUCCESS] Все ${iterations} стохастических буферов успешно обработаны. Инварианты Хоара соблюдены.`);
}

verifyMarkovProperties();

