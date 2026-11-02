// lib/logger.js
const DEBUG = process.env.DEBUG === 'true';

// Абсолютная пустая заглушка. 
// V8 видит, что тело функции пустое, и при инлайнинге 
// полностью СТИРАЕТ этот вызов из машинного кода. 
const noop = () => {};

export function createLogger(prefix) {
    if (!DEBUG) {
        // В продакшене возвращаем чистые пустышки.
        // Никаких проверок `if`, никакого сбора аргументов, 0 тактов CPU!
        return {
            debug: noop,
            info: noop,
            warn: noop,
            error: noop, // Даже ошибки в критическом цикле можно заглушить
        };
    }

    // В режиме отладки — наш собственный красивый вывод
    return {
        debug: (...args) => console.log(`\x1b[36m[DEBUG][${prefix}]\x1b[0m`, ...args),
        info: (...args) => console.log(`\x1b[32m[INFO][${prefix}]\x1b[0m`, ...args),
        warn: (...args) => console.log(`\x1b[33m[WARN][${prefix}]\x1b[0m`, ...args),
        error: (...args) => console.error(`\x1b[31m[ERROR][${prefix}]\x1b[0m`, ...args),
    };
}
