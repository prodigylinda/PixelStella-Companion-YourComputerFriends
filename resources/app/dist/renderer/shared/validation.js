const object = (v) => {
    if (!v || typeof v !== 'object' || Array.isArray(v))
        throw new Error('数据格式不正确');
    return v;
};
const text = (v, max, empty = false) => {
    if (typeof v !== 'string' || v.length > max || (!empty && !v.trim()) || v.includes('\0'))
        throw new Error('文本为空或超过长度限制');
    return v.trim();
};
const pick = (v, values) => {
    if (typeof v !== 'string' || !values.includes(v))
        throw new Error('选项不正确');
    return v;
};
const bool = (v) => { if (typeof v !== 'boolean')
    throw new Error('开关格式不正确'); return v; };
const color = (v) => { if (typeof v !== 'string' || !/^#[a-f0-9]{6}$/i.test(v))
    throw new Error('颜色格式不正确'); return v; };
export const validId = (v) => { if (typeof v !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(v))
    throw new Error('记录编号不正确'); return v; };
export function avatar(v) {
    const o = object(v);
    return { name: text(o.name, 16), mode: pick(o.mode, ['custom', 'image']), assetId: o.assetId === null ? null : validId(o.assetId),
        species: pick(o.species, ['human', 'cat', 'rabbit', 'fox']), hair: pick(o.hair, ['short', 'long', 'curly', 'twintails']),
        expression: pick(o.expression, ['smile', 'focused', 'happy', 'sleepy']), skin: color(o.skin), hairColor: color(o.hairColor), outfit: color(o.outfit), accent: color(o.accent), accessory: pick(o.accessory, ['none', 'glasses', 'headphones', 'star']) };
}
export function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return false;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
export function reminder(v) {
    const o = object(v), date = text(o.date, 10), time = text(o.time, 5);
    if (!validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
        throw new Error('请选择有效的日期和时间');
    return { id: validId(o.id), title: text(o.title, 60), subject: text(o.subject, 20, true), note: text(o.note, 300, true), date, time, repeat: pick(o.repeat, ['once', 'daily', 'weekdays']), enabled: bool(o.enabled), completed: bool(o.completed) };
}
export function localAIBase(value) {
    const base = text(value, 120);
    let u;
    try {
        u = new URL(base);
    }
    catch {
        throw new Error('本机 AI 地址格式不正确');
    }
    if (u.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname) || u.username || u.password || u.search || u.hash || u.pathname !== '/')
        throw new Error('仅允许本机回环 HTTP 地址，例如 http://127.0.0.1:7860');
    return u.origin;
}
export function settings(v) {
    const o = object(v);
    if (typeof o.petScale !== 'number' || !Number.isInteger(o.petScale) || o.petScale < 80 || o.petScale > 130)
        throw new Error('角色大小应在 80% 至 130% 之间');
    return { locale: o.locale === undefined ? 'zh' : pick(o.locale, ['zh', 'en', 'fr']), showPet: bool(o.showPet), alwaysOnTop: bool(o.alwaysOnTop), quiet: bool(o.quiet), petScale: o.petScale, aiBase: localAIBase(o.aiBase) };
}
export function state(v) {
    const o = object(v);
    if (o.version !== 1 || !Array.isArray(o.reminders) || o.reminders.length > 200 || !Array.isArray(o.receipts) || o.receipts.length > 500)
        throw new Error('本地文件版本或记录数量不正确');
    const f = object(o.focus);
    if (![f.duration, f.remaining].every(x => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 7200) || (f.deadline !== null && (typeof f.deadline !== 'number' || !Number.isFinite(f.deadline))))
        throw new Error('专注计时数据不正确');
    const reminders = o.reminders.map(reminder);
    if (new Set(reminders.map(r => r.id)).size !== reminders.length)
        throw new Error('存在重复计划编号');
    const receipts = o.receipts.map(value => { const r = object(value); if (typeof r.at !== 'number' || !Number.isFinite(r.at))
        throw new Error('提醒记录时间错误'); return { key: text(r.key, 180), reminderId: validId(r.reminderId), title: text(r.title, 60), at: r.at, status: pick(r.status, ['submitted', 'in-app']) }; });
    return { version: 1, avatar: avatar(o.avatar), settings: settings(o.settings), reminders, receipts, focus: { duration: f.duration, remaining: f.remaining, deadline: f.deadline } };
}
