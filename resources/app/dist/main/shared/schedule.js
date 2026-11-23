"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dayKey = dayKey;
exports.occurrence = occurrence;
exports.due = due;
exports.nextOccurrence = nextOccurrence;
function dayKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function occurrence(reminder, day) {
    const key = dayKey(day);
    if (!reminder.enabled || reminder.completed || key < reminder.date || (reminder.repeat === 'once' && key !== reminder.date))
        return null;
    if (reminder.repeat === 'weekdays' && [0, 6].includes(day.getDay()))
        return null;
    const [h, m] = reminder.time.split(':').map(Number);
    const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
    return { key: `${reminder.id}:${key}:${reminder.time}`, at: date.getTime() };
}
function due(reminders, receipts, now) {
    const delivered = new Set(receipts.map(r => r.key)), result = [];
    for (const reminder of reminders) {
        const candidates = [];
        for (const offset of [0, -1]) {
            const d = new Date(now);
            d.setDate(d.getDate() + offset);
            const o = occurrence(reminder, d);
            if (o && o.at <= now && now - o.at <= 24 * 3600_000)
                candidates.push(o);
        }
        const latest = candidates.sort((a, b) => b.at - a.at)[0];
        if (latest && !delivered.has(latest.key))
            result.push({ reminder, ...latest });
    }
    return result.sort((a, b) => a.at - b.at);
}
function nextOccurrence(reminder, now) {
    if (!reminder.enabled || reminder.completed)
        return null;
    const start = new Date(now);
    if (reminder.date > dayKey(start)) {
        const [y, m, d] = reminder.date.split('-').map(Number);
        start.setFullYear(y, m - 1, d);
        start.setHours(0, 0, 0, 0);
    }
    for (let i = 0; i <= 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const o = occurrence(reminder, d);
        if (o && o.at >= now)
            return o.at;
    }
    return null;
}
