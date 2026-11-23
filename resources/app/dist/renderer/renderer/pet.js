import { translate, translateParts } from '../shared/i18n.js';
import { staticLocalization } from './localization.js';
let locale = 'zh';
const t = (text) => translate(text, locale);
const html = (parts, ...values) => translateParts(locale, parts, values);
const localizeStatic = staticLocalization(document);
import { avatarSvg } from '../shared/avatar.js';
const $ = (id) => document.getElementById(id);
let current, active = null;
function render(value) { locale = value.state.settings.locale; localizeStatic(locale); current = value; const c = $('character'); c.replaceChildren(); if (value.state.avatar.mode === 'image' && value.image) {
    const image = new Image();
    image.src = value.image;
    image.alt = value.state.avatar.name;
    c.append(image);
}
else
    c.innerHTML = avatarSvg(value.state.avatar, locale); $('pet-name').textContent = value.state.avatar.name; if (!active)
    $('bubble').textContent = value.state.focus.deadline ? t('我陪你安静专注一会儿。') : t('今天也一起，慢慢来。'); }
$('panel').onclick = () => window.pixelStella.openPanel();
$('hide').onclick = () => window.pixelStella.hidePet();
$('dismiss').onclick = () => { active = null; $('alert-actions').hidden = true; render(current); };
$('snooze').onclick = async () => { if (!active || active.kind !== 'reminder')
    return; const r = await window.pixelStella.dispatch({ type: 'snooze', id: active.id }); $('bubble').textContent = r.ok ? t('好，5 分钟后再提醒你。') : r.error || t('稍后提醒未设置成功'); if (r.ok) {
    active = null;
    $('alert-actions').hidden = true;
} };
window.pixelStella.onState(render);
window.pixelStella.onAlert(alert => { active = alert; $('bubble').textContent = alert.title; $('alert-actions').hidden = false; $('snooze').hidden = alert.kind !== 'reminder'; });
void window.pixelStella.snapshot().then(render);
