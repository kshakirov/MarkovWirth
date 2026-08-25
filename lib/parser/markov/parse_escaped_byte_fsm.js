import { Buffer } from "node:buffer";


const rules = [
    [Buffer.from([0x22,0x22,0x22,0x2C]), Buffer.from([])],
    [Buffer.from([0x22,0x22,0x22,0x0A]), Buffer.from([])],
    [Buffer.from([0x22,0x22]), Buffer.from([0x01,0x02])],
    [Buffer.from([0x22,0x2C]), Buffer.from([0x03,0x03])], // Запятая
    [Buffer.from([0x22,0x0A]), Buffer.from([0x03,0x03])], // Перенос строки (без промежуточных FF)
    [Buffer.from([0x22]), Buffer.from([0x04])]
];

export function MarkovEngine(index, buffer) {
    let buffer_length = buffer.length,
        capacity = 256,
        buffer_tail = 0,
	start = index == 0? 0 : index - 1; 
    

    let change = false;
    let tmp = Buffer.alloc(capacity);
    let start_index = 0;

    buffer.copy(tmp, 0, index, index + buffer_length);
    buffer_tail = buffer_length;

    outer_loop: do {
        change = false;

        // Поиск самого ЛЕВОГО совпадения в буфере
        let matchResult = findEarliestRuleMatch(tmp, rules, buffer_tail, start_index);

        if (matchResult) {
            let { rule: r, offset } = matchResult;

            if (r[0].length === 4) {
                if (r[0][3] === 0x2C) {
                    return [true, index + offset + 4,start];
                } else {
                    return [true, index + offset + 3,start];
                }
            } else if (r[0].length === 1) {
                return [false, offset,start];
            } else if (r[1][0] === 0x03) {
                return [true, index + offset + 1,start];
            } else {
                reInPlaceTmpByRule(tmp, offset, r[1]);
                change = true;
                continue outer_loop;
            }
        }
    } while (change);

    return [false, capacity,start];
}

/**
 * Ищет самое ЛЕВОЕ совпадение правил.
 * Сначала двигаем позицию `i` слева направо.
 * Для каждой позиции `i` проверяем правила сверху вниз.
 */
function findEarliestRuleMatch(tmp, rules, buffer_tail, start_index) {
    for (let i = start_index; i <= buffer_tail; i++) {
        for (let r of rules) {
            let rule = r[0];
            if (i + rule.length <= buffer_tail) {
                if (Buffer.compare(rule, tmp.subarray(i, i + rule.length)) === 0) {
                    return { rule: r, offset: i };
                }
            }
        }
    }
    return null;
}

function reInPlaceTmpByRule(tmp, offset, rule) {
    rule.copy(tmp, offset, 0, rule.length);
}
