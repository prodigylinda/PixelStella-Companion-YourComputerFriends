import { translate, translateParts, intlLocale } from '../shared/i18n.js';
import { staticLocalization } from './localization.js';
let locale = 'zh';
const t = (text) => translate(text, locale);
const html = (parts, ...values) => translateParts(locale, parts, values);
const localizeStatic = staticLocalization(document);
import { avatarSvg } from '../shared/avatar.js';
import { dayKey, nextOccurrence, occurrence } from '../shared/schedule.js';
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const labels = { today: '今日计划', avatar: '角色工坊', focus: '专注时刻', settings: '偏好设置' };
let snap, tab = 'today', filter = 'today', draft, draftSettings, focusSelection = 25, aiWorking = false, aiPrompt = '';
let toastTimer;
const clock = (n) => `${String(Math.floor(Math.max(0, n) / 60)).padStart(2, '0')}:${String(Math.max(0, n) % 60).padStart(2, '0')}`;
function toast(text) { $('toast').textContent = text; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 5500); }
function figure(a, image = snap.image) { return a.mode === 'image' && image ? html `<img src="${esc(image)}" alt="${esc(a.name)}的本地角色图片">` : avatarSvg(a, locale); }
async function action(value) { try {
    const r = await window.pixelStella.dispatch(value);
    if (!r.ok || !r.value) {
        toast(r.error || t('操作未完成'));
        return false;
    }
    receive(r.value);
    return true;
}
catch {
    toast(t('应用连接暂时不可用，请重新打开PixelStella'));
    return false;
} }
function receive(value) {
    if (!snap || JSON.stringify(value.state.avatar) !== JSON.stringify(snap.state.avatar))
        draft = structuredClone(value.state.avatar);
    if (!snap || JSON.stringify(value.state.settings) !== JSON.stringify(snap.state.settings))
        draftSettings = structuredClone(value.state.settings);
    if (!snap || value.state.focus.duration !== snap.state.focus.duration)
        focusSelection = value.state.focus.duration / 60;
    locale = value.state.settings.locale;
    localizeStatic(locale);
    snap = value;
    render();
}
function heading(title, caption, kicker, extra = '') { return `<div class="heading"><div><span class="eyebrow">${t(kicker)}</span><h1>${title}</h1><p>${caption}</p></div>${extra}</div>`; }
function todayItems() { const d = new Date(); return snap.state.reminders.filter(r => occurrence({ ...r, enabled: true, completed: false }, d) !== null); }
function dashboard() {
    const all = snap.state.reminders, items = (filter === 'today' ? todayItems() : [...all]).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const next = all.map(r => nextOccurrence(r, Date.now())).filter((n) => n !== null).sort((a, b) => a - b)[0];
    return heading(t('今天也一起，慢慢来。'), t('把想做的事拆成小步，让小伙伴陪你记得。'), 'YOUR LITTLE DAILY COMPANION', `<div class="date-pill">${esc(new Date().toLocaleDateString(intlLocale(locale), { month: 'long', day: 'numeric', weekday: 'long' }))}</div>`) +
        html `<section class="hero"><div class="hero-copy"><span class="tiny-label">SMALL STEPS, GOOD DAYS</span><h2>计划不用很满，<br>留一点时间，给正在成长的自己。</h2><p>安排一件小事，剩下的交给提醒。${esc(snap.state.avatar.name)}会在桌面陪着你。</p></div><div class="hero-stars" aria-hidden="true">✧</div></section>
  <section class="stats" aria-label="当前计划概览"><div class="stat"><div class="stat-symbol" aria-hidden="true">▦</div><div><strong>${todayItems().filter(r => r.enabled && !r.completed).length}</strong><span>今天待办计划</span></div></div><div class="stat"><div class="stat-symbol" aria-hidden="true">✓</div><div><strong>${todayItems().filter(r => r.completed).length}</strong><span>今日一次性计划已完成</span></div></div><div class="stat"><div class="stat-symbol" aria-hidden="true">◷</div><div><strong>${next ? new Date(next).toLocaleTimeString(intlLocale(locale), { hour: '2-digit', minute: '2-digit' }) : '—'}</strong><span>下一项计划提醒</span></div></div></section>
  <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h2>留给今天的小计划</h2><small>一件一件来，就已经很好。</small></div><button class="button primary tiny" data-add>＋ 添加计划</button></div><div class="filters" aria-label="计划筛选"><button data-filter="today" aria-pressed="${filter === 'today'}">今天</button><button data-filter="all" aria-pressed="${filter === 'all'}">全部计划</button></div><div id="task-list">${items.length ? items.map(taskCard).join('') : html `<div class="empty"><span class="empty-symbol" aria-hidden="true">✧</span><strong>这里还留着一点空白</strong><p>可以先安排十分钟阅读，或一次短短的休息。不需要一下填满。</p><button class="button secondary" data-add>添加第一项计划</button></div>`}</div></section>
  <aside><section class="panel buddy-panel"><div class="buddy-header"><h3>我的小伙伴</h3><span>${snap.state.settings.showPet ? t('桌面陪伴中') : t('暂时收起')}</span></div><div class="buddy-figure">${figure(snap.state.avatar)}</div><div class="buddy-name">${esc(snap.state.avatar.name)}</div><p class="buddy-caption">不是催促，是替你记得。</p><div class="buddy-speech">“先做一小步，也算很棒的开始。”</div><button class="button secondary wide" data-go-avatar>定制我的角色 <span>↗</span></button></section><p class="pet-info">✦ 拖动角色可以换位置；右键角色可打开菜单。关闭本窗口后，PixelStella继续在系统托盘陪伴。</p></aside></div>`;
}
function taskCard(r) {
    const done = r.completed || !r.enabled;
    return html `<article class="task ${done ? 'done' : ''}" data-task="${r.id}"><button class="task-toggle" data-toggle="${r.id}" aria-label="${r.repeat === 'once' ? (r.completed ? t('取消完成') : t('完成')) : (r.enabled ? t('暂停') : t('启用'))} ${esc(r.title)}">${done ? '✓' : ''}</button><div class="task-time">${r.time}</div><div class="task-body"><div class="task-title">${esc(r.title)}</div><div class="task-meta">${r.subject ? `<span class="tag">${esc(r.subject)}</span>` : ''}<span>${esc(r.date)} · ${r.repeat === 'once' ? t('仅一次') : r.repeat === 'daily' ? t('每天') : t('周一至周五')}${!r.enabled ? t(' · 已暂停') : ''}</span></div>${r.note ? `<p class="task-note">${esc(r.note)}</p>` : ''}</div><div class="task-actions"><button class="icon-button" data-edit="${r.id}" aria-label="编辑 ${esc(r.title)}">↗</button><button class="icon-button" data-delete="${r.id}" aria-label="删除 ${esc(r.title)}">×</button></div></article>`;
}
function select(name, title, values, value) { return `<label class="field">${title}<select name="${name}" aria-label="${title}">${values.map(([v, l]) => `<option value="${v}" ${v === value ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`; }
function studio() {
    const a = draft;
    return heading(t('把想象，变成小伙伴。'), t('调一调喜欢的颜色，给它一个名字。这个小宇宙由你决定。'), 'CHARACTER STUDIO') +
        html `<div class="studio-grid"><section class="character-stage" aria-label="角色实时预览"><span class="stage-chip">${a.mode === 'custom' ? t('原创矢量 · 离线定制') : t('本地图片角色')}</span><div class="stage-character" id="stage-character">${figure(a)}</div><div class="stage-name" id="stage-name">${esc(a.name)}</div><p class="stage-description">你的桌面伙伴，独一份的小小陪伴。</p></section><div class="studio-controls"><section class="panel"><h3>一点点，捏出喜欢的样子</h3><form id="avatar-form"><label class="field">小伙伴的名字<input name="name" value="${esc(a.name)}" maxlength="16" required></label><div class="form-row">${select('species', t('角色类型'), [['human', t('Q 版小人')], ['cat', t('猫耳伙伴')], ['rabbit', t('兔耳伙伴')], ['fox', t('狐狸伙伴')]], a.species)}${select('hair', t('发型'), [['short', t('轻盈短发')], ['long', t('柔软长发')], ['curly', t('蓬松卷发')], ['twintails', t('双马尾')]], a.hair)}</div><div class="form-row">${select('expression', t('小表情'), [['smile', t('温柔微笑')], ['focused', t('认真专注')], ['happy', t('元气弯眼')], ['sleepy', t('困困眯眼')]], a.expression)}${select('accessory', t('小配饰'), [['none', t('简简单单')], ['glasses', t('圆框眼镜')], ['headphones', t('头戴耳机')], ['star', t('星星发夹')]], a.accessory)}</div><div class="color-fields">${[['skin', t('肤色')], ['hairColor', t('发色')], ['outfit', t('衣服')], ['accent', t('配饰')]].map(([key, label]) => `<label class="field">${label}<input type="color" name="${key}" value="${a[key]}"></label>`).join('')}</div><p class="form-help">这是原创矢量角色的参数化定制，不是 AI 文生图，也不会分析人脸。调整外观时会切回定制模式。</p><div class="control-actions"><button class="button primary" type="submit">设为桌面小伙伴 ✦</button><button class="button secondary" type="button" id="random-avatar">换一组灵感</button><button class="button soft" type="button" id="export-avatar">导出当前已保存头像</button></div></form></section><section class="panel"><h3>带上自己的角色图片</h3><p class="form-help">导入 PNG、JPG 或 WebP，最大 8 MB、4096 × 4096。透明 PNG 更适合悬浮展示；普通照片只会作为图片展示，不会自动转 Q 版或去背景。文件在本机解码并保存为 PNG。</p><button id="import-image" class="button secondary">＋ 导入本地角色图片</button></section><section class="panel"><h3>用描述创造新角色 <span class="ai-label">可选 · 本机 AI</span></h3><p class="form-help">需要你自行安装 Stable Diffusion WebUI、模型并启用 --api。这里不下载模型、不连接云端；未安装时会明确报错，不使用预设图冒充生成结果。当前仅支持文字生成，不支持照片转 Q 版。</p><label class="field">本机绘图接口<input id="ai-base" value="${esc(draftSettings.aiBase)}" maxlength="120" placeholder="http://127.0.0.1:7860"></label><label class="field">想要的角色<textarea id="ai-prompt" rows="3" maxlength="1000" placeholder="例如：戴圆眼镜的白发猫耳少年，绿色卫衣，全身Q版……">${esc(aiPrompt)}</textarea></label><div class="control-actions"><button id="test-ai" class="button secondary" ${aiWorking ? 'disabled' : ''}>检查本机接口</button><button id="generate-ai" class="button primary" ${aiWorking ? 'disabled' : ''}>${aiWorking ? t('生成中，请稍候…') : t('生成并设为角色')}</button></div><p class="form-help">生成最长等待 120 秒；不保证透明背景。请确认第三方绘图程序本身没有云端转发设置。</p></section></div></div>`;
}
function focusView() {
    const f = snap.state.focus;
    return heading(t('这一小段时间，只做一件事。'), t('不追赶，也不比较。把注意力轻轻放回眼前。'), 'A MOMENT TO FOCUS') + html `<div class="focus-layout"><section class="panel focus-stage"><span class="eyebrow">STAY WITH WHAT MATTERS</span><h2>安静的专注时刻</h2><div class="focus-clock"><strong id="focus-clock">${clock(f.remaining)}</strong><span id="focus-status">${f.deadline ? t('正在专注') : t('准备好了，就开始吧')}</span></div><div class="focus-presets">${[15, 25, 45].map(n => html `<button data-minutes="${n}" aria-pressed="${focusSelection === n}" ${f.deadline ? 'disabled' : ''}>${n} 分钟</button>`).join('')}</div><div class="control-actions"><button id="start-focus" class="button primary">${f.deadline ? t('暂停一下') : f.remaining < f.duration && f.remaining > 0 ? t('继续专注') : t('开始这段专注')}</button><button id="reset-focus" class="button secondary">重新开始</button></div></section><aside class="panel"><h3>${esc(snap.state.avatar.name)}，也在这里。</h3><div class="focus-illustration">${figure(snap.state.avatar)}</div><div class="note-box">可以先把手机放远一点。<br>选一件大小刚好的事，做到哪里，就记下哪里。<br>结束后记得休息，不必责怪走神的自己。</div><p class="pet-info">计时保存在本机。关闭主窗口仍继续计时，彻底退出应用后不会即时弹出通知；再次启动时会检查已结束的计时。</p></aside></div>`;
}
function settingsView() {
    const s = draftSettings;
    return heading(t('让陪伴，刚刚好。'), t('选择适合自己的节奏，也掌握数据留在哪里。'), 'YOUR SPACE, YOUR PACE') + html `<div class="settings-stack"><section class="panel"><h2>桌面与提醒</h2><form id="settings-form">${[['showPet', t('在桌面显示小伙伴'), t('收起后可通过工具栏或系统托盘再次召唤。')], ['alwaysOnTop', t('让桌宠保持置顶'), t('角色不会抢走键盘焦点，打开其他窗口时也可以陪着你。')], ['quiet', t('安静陪伴模式'), t('不发起 Windows 系统通知；应用内和桌宠提醒仍然保留。')]].map(([key, title, note]) => `<label class="setting-row"><span><strong>${title}</strong><small>${note}</small></span><input type="checkbox" name="${key}" ${s[key] ? 'checked' : ''}></label>`).join('')}<label class="field">桌宠大小 <input type="range" name="petScale" min="80" max="130" step="10" value="${s.petScale}"></label><p class="form-help">Windows 通知是否实际显示取决于系统权限、勿扰设置和应用注册。历史中的“已发起系统通知”不表示一定已送达。最近 24 小时错过的提醒会在启动后补发；重复计划只补发最近一次。</p><button class="button primary" type="submit">保存偏好设置</button></form></section><section class="panel"><div class="panel-head"><h2>提醒记录</h2><span class="tag">最近 ${Math.min(snap.state.receipts.length, 10)} 条</span></div>${snap.state.receipts.length ? snap.state.receipts.slice(0, 10).map(r => `<div class="receipt">${esc(r.title)}<small>${esc(new Date(r.at).toLocaleString(intlLocale(locale)))} · ${r.status === 'submitted' ? t('已发起系统通知，送达未确认') : t('应用内提醒')}</small></div>`).join('') : t('<p class="form-help">还没有触发记录。设置一项计划后，小伙伴会在约定时间提醒。</p>')}</section><section class="panel"><h2>只属于本机的小宇宙</h2><p class="form-help">角色、图片、计划与触发记录保存在当前 Windows 用户的数据目录。无需账号、没有云端同步或遥测。存档未加密，共用电脑时请留意隐私。导出的 JSON 只包含计划，不含头像；分享前请检查私人备注。</p><div class="control-actions"><button class="button secondary" id="export-plans">导出学习计划 JSON</button><button class="button danger" id="quit-app">彻底退出PixelStella</button></div><p class="pet-info">关闭窗口只是收进托盘。彻底退出后，提醒停止；当前版本不自动设置开机启动。</p></section></div>`;
}
function render() {
    $('language').value = locale;
    $('breadcrumb').textContent = t(labels[tab] || '今日计划');
    document.querySelectorAll('[data-nav]').forEach(b => b.setAttribute('aria-current', b.dataset.nav === tab ? 'page' : 'false'));
    $('storage-warning').hidden = !snap.storageWarning;
    $('storage-warning').textContent = snap.storageWarning || '';
    $('view').innerHTML = tab === 'avatar' ? studio() : tab === 'focus' ? focusView() : tab === 'settings' ? settingsView() : dashboard();
    bind();
    updateClock();
}
function openReminder(id) {
    const dialog = $('reminder-dialog'), form = $('reminder-form');
    form.reset();
    $('form-error').textContent = '';
    const r = snap.state.reminders.find(x => x.id === id), date = new Date(Date.now() + 5 * 60_000);
    const data = r || { id: crypto.randomUUID(), title: '', subject: '', note: '', date: dayKey(date), time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`, repeat: 'once' };
    for (const [name, value] of Object.entries(data)) {
        const el = form.elements.namedItem(name);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)
            el.value = String(value);
    }
    $('dialog-title').textContent = r ? t('调整一下小计划') : t('安排一件小事');
    dialog.showModal();
}
function bind() {
    document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => openReminder());
    document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { filter = b.dataset.filter; render(); });
    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openReminder(b.dataset.edit));
    document.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => { const r = snap.state.reminders.find(x => x.id === b.dataset.toggle); if (!r)
        return; void action(r.repeat === 'once' ? { type: 'complete', id: r.id } : { type: 'save-reminder', value: { ...r, enabled: !r.enabled } }); });
    document.querySelectorAll('[data-delete]').forEach(b => b.onclick = () => { if (confirm(t('删除这项计划？这只会删除本机的这一项计划。')))
        void action({ type: 'delete-reminder', id: b.dataset.delete }); });
    document.querySelector('[data-go-avatar]')?.addEventListener('click', () => go('avatar'));
    if (tab === 'avatar') {
        const form = $('avatar-form');
        form.oninput = () => { const f = new FormData(form); draft = { ...draft, mode: 'custom', name: String(f.get('name')), species: f.get('species'), hair: f.get('hair'), expression: f.get('expression'), accessory: f.get('accessory'), skin: String(f.get('skin')), hairColor: String(f.get('hairColor')), outfit: String(f.get('outfit')), accent: String(f.get('accent')) }; if (draft.name.trim()) {
            try {
                $('stage-character').innerHTML = avatarSvg(draft, locale);
                $('stage-name').textContent = draft.name;
            }
            catch { }
        } };
        form.onsubmit = async (e) => { e.preventDefault(); if (await action({ type: 'avatar', value: draft }))
            toast(t('新的小伙伴，已在桌面等你。')); };
        $('random-avatar').onclick = () => { const colors = ['#9bb3ff', '#92bfa3', '#ebad98', '#c4a4d6', '#edcb7d'], hair = ['#493d5c', '#855a48', '#d9c6ac', '#435b59']; draft = { ...draft, mode: 'custom', outfit: colors[Math.floor(Math.random() * colors.length)], hairColor: hair[Math.floor(Math.random() * hair.length)], species: ['cat', 'human', 'fox', 'rabbit'][Math.floor(Math.random() * 4)] }; render(); };
        $('import-image').onclick = async () => { const r = await window.pixelStella.importImage(); if (!r.ok)
            toast(r.error || t('导入失败'));
        else if (r.value) {
            receive(r.value);
            toast(t('已将本地图片设为桌面角色。'));
        } };
        $('export-avatar').onclick = async () => {
            try {
                let png;
                if (snap.state.avatar.mode === 'custom') {
                    const img = new Image();
                    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(avatarSvg(snap.state.avatar, locale).replace('<svg ', '<svg width="480" height="512" '));
                    await img.decode();
                    const canvas = document.createElement('canvas');
                    canvas.width = 480;
                    canvas.height = 512;
                    const ctx = canvas.getContext('2d');
                    if (!ctx)
                        throw new Error();
                    ctx.drawImage(img, 0, 0, 480, 512);
                    png = canvas.toDataURL('image/png');
                }
                const r = await window.pixelStella.exportAvatar(png);
                toast(!r.ok ? r.error || t('导出失败') : r.value ? t('PNG 头像已导出。') : t('已取消导出。'));
            }
            catch {
                toast(t('头像导出未完成，请重试。'));
            }
        };
        $('ai-prompt').oninput = e => aiPrompt = e.target.value;
        $('ai-base').oninput = e => draftSettings.aiBase = e.target.value;
        $('test-ai').onclick = () => void ai(false);
        $('generate-ai').onclick = () => void ai(true);
    }
    if (tab === 'focus') {
        document.querySelectorAll('[data-minutes]').forEach(b => b.onclick = () => { focusSelection = Number(b.dataset.minutes); render(); });
        $('start-focus').onclick = () => { const f = snap.state.focus; void action(f.deadline ? { type: 'focus', command: 'pause' } : { type: 'focus', command: 'start', ...(f.remaining === f.duration || f.remaining === 0 || focusSelection !== f.duration / 60 ? { minutes: focusSelection } : {}) }); };
        $('reset-focus').onclick = () => void action({ type: 'focus', command: 'reset' });
    }
    if (tab === 'settings') {
        $('settings-form').onsubmit = async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); if (await action({ type: 'settings', value: { ...draftSettings, showPet: f.has('showPet'), alwaysOnTop: f.has('alwaysOnTop'), quiet: f.has('quiet'), petScale: Number(f.get('petScale')) } }))
            toast(t('偏好已保存在本机。')); };
        $('export-plans').onclick = async () => { const r = await window.pixelStella.exportPlans(); toast(!r.ok ? r.error || t('导出未完成') : r.value ? t('计划已导出，请妥善保管私人备注。') : t('已取消导出。')); };
        $('quit-app').onclick = () => window.pixelStella.quit();
    }
}
async function ai(generate) {
    if (aiWorking)
        return;
    if (generate && !aiPrompt.trim()) {
        toast(t('先写下你想要的角色描述吧。'));
        return;
    }
    if (!await action({ type: 'settings', value: draftSettings }))
        return;
    aiWorking = true;
    render();
    try {
        if (generate) {
            const result = await window.pixelStella.generateAI(aiPrompt);
            if (result.ok && result.value) {
                receive(result.value);
                toast(t('已使用本机 AI 返回的图片。'));
            }
            else
                toast(result.error || t('生成没有完成'));
        }
        else {
            const result = await window.pixelStella.testAI();
            toast(result.ok ? result.value || t('接口已响应') : result.error || t('本机接口未连接'));
        }
    }
    catch {
        toast(t('本机绘图请求未完成，请检查本机服务后重试。'));
    }
    finally {
        aiWorking = false;
        render();
    }
}
function updateClock() {
    if (!snap || tab !== 'focus')
        return;
    const f = snap.state.focus;
    const seconds = f.deadline ? Math.ceil((f.deadline - Date.now()) / 1000) : focusSelection !== f.duration / 60 ? focusSelection * 60 : f.remaining;
    $('focus-clock').textContent = clock(Math.max(0, seconds));
    $('focus-status').textContent = f.deadline ? t('正在专注') : seconds === 0 ? t('完成啦，休息一下') : t('准备好了，就开始吧');
}
function go(value) { tab = value; render(); }
document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => go(b.dataset.nav));
$('language').onchange = e => void action({ type: 'settings', value: { ...snap.state.settings, locale: e.target.value } });
$('show-pet').onclick = () => void action({ type: 'settings', value: { ...snap.state.settings, showPet: true } });
for (const id of ['close-dialog', 'cancel-dialog'])
    $(id).onclick = () => $('reminder-dialog').close();
$('reminder-form').onsubmit = async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const old = snap.state.reminders.find(r => r.id === f.get('id')); const value = { id: String(f.get('id')), title: String(f.get('title')), subject: String(f.get('subject')), note: String(f.get('note')), date: String(f.get('date')), time: String(f.get('time')), repeat: f.get('repeat'), enabled: old?.enabled ?? true, completed: old?.completed ?? false }; if (await action({ type: 'save-reminder', value })) {
    $('reminder-dialog').close();
    toast(t('计划记好啦，到时间会提醒你。'));
}
else
    $('form-error').textContent = t('保存未完成，请检查输入和本地存储状态。'); };
window.pixelStella.onState(receive);
window.pixelStella.onAlert(alert => toast(`${alert.title} · ${alert.note}`));
setInterval(updateClock, 1000);
void window.pixelStella.snapshot().then(receive).catch(() => { $('view').textContent = t('无法连接本地应用。请关闭此窗口，从启动程序重新打开。'); });
