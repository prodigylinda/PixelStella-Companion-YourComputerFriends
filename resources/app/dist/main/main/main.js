"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const i18n_js_1 = require("../shared/i18n.js");
const t = (text) => (0, i18n_js_1.translate)(text, store?.value.settings.locale || 'zh');
const html = (parts, ...values) => (0, i18n_js_1.translateParts)(store?.value.settings.locale || 'zh', parts, values);
const electron_1 = require("electron");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const node_crypto_1 = require("node:crypto");
const storage_js_1 = require("./storage.js");
const migration_js_1 = require("./migration.js");
const ai_js_1 = require("./ai.js");
const validation_js_1 = require("../shared/validation.js");
const schedule_js_1 = require("../shared/schedule.js");
electron_1.app.setName('PixelStella');
electron_1.app.setAppUserModelId('com.prodigylinda.pixelstella');
if (process.env.PIXELSTELLA_TEST === '1' && process.env.PIXELSTELLA_DATA_DIR)
    electron_1.app.setPath('userData', node_path_1.default.resolve(process.env.PIXELSTELLA_DATA_DIR));
else
    electron_1.app.setPath('userData', node_path_1.default.join(electron_1.app.getPath('appData'), 'PixelStella'));
const locked = electron_1.app.requestSingleInstanceLock();
if (!locked)
    electron_1.app.quit();
let panel, pet, tray, store, quitting = false, aiBusy = false;
const renderer = node_path_1.default.resolve(__dirname, '../../renderer/renderer');
const panelURL = (0, node_url_1.pathToFileURL)(node_path_1.default.join(renderer, 'index.html')).href, petURL = (0, node_url_1.pathToFileURL)(node_path_1.default.join(renderer, 'pet.html')).href;
function imageData() {
    const id = store.value.avatar.assetId;
    if (!id)
        return null;
    try {
        const p = node_path_1.default.join(store.directory, 'assets', (0, validation_js_1.validId)(id) + '.png');
        if (node_fs_1.default.statSync(p).size > 8_000_000)
            return null;
        return 'data:image/png;base64,' + node_fs_1.default.readFileSync(p).toString('base64');
    }
    catch {
        return null;
    }
}
function snapshot() { return { state: store.value, image: imageData(), notificationSupported: electron_1.Notification.isSupported(), storageWarning: store.warning ? t(store.warning) : null }; }
function broadcast() { for (const w of [panel, pet])
    if (w && !w.isDestroyed())
        w.webContents.send('state', snapshot()); }
function ensure(event) {
    if (![panel?.webContents, pet?.webContents].includes(event.sender) || ![panelURL, petURL].includes(event.senderFrame?.url || ''))
        throw new Error(t('请求来源不受允许'));
}
function showPanel() { if (panel.isMinimized())
    panel.restore(); panel.show(); panel.focus(); }
function changePet(visible) { void dispatch({ type: 'settings', value: { ...store.value.settings, showPet: visible } }).catch(() => broadcast()); }
function syncPet() {
    if (!pet || pet.isDestroyed())
        return;
    const scale = store.value.settings.petScale / 100;
    pet.setSize(Math.round(234 * scale), Math.round(320 * scale));
    const bounds = pet.getBounds(), area = electron_1.screen.getDisplayMatching(bounds).workArea;
    pet.setPosition(Math.max(area.x, Math.min(bounds.x, area.x + area.width - bounds.width)), Math.max(area.y, Math.min(bounds.y, area.y + area.height - bounds.height)));
    pet.setAlwaysOnTop(store.value.settings.alwaysOnTop, 'floating');
    if (store.value.settings.showPet)
        pet.showInactive();
    else
        pet.hide();
}
function sendAlert(alert) {
    for (const w of [panel, pet])
        if (!w.isDestroyed())
            w.webContents.send('alert', alert);
    if (!store.value.settings.quiet && electron_1.Notification.isSupported()) {
        try {
            const notification = new electron_1.Notification({ title: alert.title, body: alert.note || t('打开PixelStella，查看你的学习计划。'), silent: false });
            notification.on('click', showPanel);
            notification.on('failed', () => { try {
                const next = structuredClone(store.value);
                const receipt = next.receipts.find(r => r.reminderId === alert.id);
                if (receipt) {
                    receipt.status = 'in-app';
                    store.save(next);
                    broadcast();
                }
            }
            catch { } });
            notification.show();
            return 'submitted';
        }
        catch { }
    }
    return 'in-app';
}
function tick() {
    if (store.warning)
        return;
    const now = Date.now(), items = (0, schedule_js_1.due)(store.value.reminders, store.value.receipts, now);
    const focusDone = store.value.focus.deadline !== null && store.value.focus.deadline <= now;
    if (!items.length && !focusDone)
        return;
    const next = structuredClone(store.value);
    const alerts = items.map(({ reminder }) => ({ id: reminder.id, title: reminder.title, note: reminder.note || html `该开始${reminder.subject || t('这段学习')}啦。按自己的节奏来。`, kind: 'reminder' }));
    for (const item of items)
        next.receipts.unshift({ key: item.key, reminderId: item.reminder.id, title: item.reminder.title, at: now, status: 'in-app' });
    if (focusDone) {
        next.focus.deadline = null;
        next.focus.remaining = 0;
        alerts.push({ id: 'focus', title: t('这段专注完成啦'), note: t('辛苦了，起身活动一下，让眼睛休息片刻。'), kind: 'focus' });
    }
    next.receipts = next.receipts.slice(0, 500);
    try {
        store.save(next);
        for (const alert of alerts) {
            const status = sendAlert(alert);
            const receipt = next.receipts.find(r => r.reminderId === alert.id);
            if (receipt)
                receipt.status = status;
        }
        store.save(next);
        broadcast();
    }
    catch {
        broadcast();
    }
}
function storeImage(bytes) {
    if (bytes.length > 8_000_000)
        throw new Error(t('图片不得超过 8 MB'));
    let image = electron_1.nativeImage.createFromBuffer(bytes);
    if (image.isEmpty())
        throw new Error(t('无法读取图片，请使用 PNG、JPG 或 WebP'));
    const size = image.getSize();
    if (size.width > 4096 || size.height > 4096)
        throw new Error(t('图片尺寸不得超过 4096 × 4096'));
    if (size.width > 1024 || size.height > 1024)
        image = image.resize(size.width >= size.height ? { width: 1024 } : { height: 1024 });
    const png = image.toPNG(), id = (0, node_crypto_1.createHash)('sha256').update(png).digest('hex');
    const dir = node_path_1.default.join(store.directory, 'assets');
    node_fs_1.default.mkdirSync(dir, { recursive: true });
    const dest = node_path_1.default.join(dir, id + '.png');
    if (!node_fs_1.default.existsSync(dest))
        node_fs_1.default.writeFileSync(dest, png, { flag: 'wx', mode: 0o600 });
    return id;
}
async function dispatch(value) {
    if (!value || typeof value !== 'object')
        throw new Error(t('操作格式不正确'));
    const a = value, next = structuredClone(store.value);
    switch (a.type) {
        case 'avatar': {
            const v = (0, validation_js_1.avatar)(a.value);
            if (v.mode === 'image' && (!v.assetId || !node_fs_1.default.existsSync(node_path_1.default.join(store.directory, 'assets', v.assetId + '.png'))))
                throw new Error(t('请先导入或生成一张角色图片'));
            next.avatar = v;
            break;
        }
        case 'save-reminder': {
            const r = (0, validation_js_1.reminder)(a.value);
            const old = next.reminders.findIndex(x => x.id === r.id);
            if (old < 0 && next.reminders.length >= 200)
                throw new Error(t('最多保存 200 条计划，请先整理旧计划'));
            if (old >= 0)
                next.reminders[old] = r;
            else
                next.reminders.push(r);
            break;
        }
        case 'delete-reminder': {
            next.reminders = next.reminders.filter(r => r.id !== (0, validation_js_1.validId)(a.id));
            break;
        }
        case 'complete': {
            const r = next.reminders.find(x => x.id === (0, validation_js_1.validId)(a.id));
            if (!r)
                throw new Error(t('没有找到这条计划'));
            r.completed = !r.completed;
            break;
        }
        case 'settings':
            next.settings = (0, validation_js_1.settings)(a.value);
            break;
        case 'focus': {
            if (a.command === 'start') {
                if (next.focus.deadline)
                    throw new Error(t('专注计时已经在运行'));
                if (a.minutes !== undefined) {
                    if (typeof a.minutes !== 'number' || !Number.isInteger(a.minutes) || a.minutes < 1 || a.minutes > 120)
                        throw new Error(t('专注时长应为 1 至 120 分钟'));
                    next.focus.duration = a.minutes * 60;
                    next.focus.remaining = next.focus.duration;
                }
                if (!next.focus.remaining)
                    next.focus.remaining = next.focus.duration;
                next.focus.deadline = Date.now() + next.focus.remaining * 1000;
            }
            else if (a.command === 'pause') {
                if (next.focus.deadline)
                    next.focus.remaining = Math.max(0, Math.ceil((next.focus.deadline - Date.now()) / 1000));
                next.focus.deadline = null;
            }
            else if (a.command === 'reset') {
                next.focus.deadline = null;
                next.focus.remaining = next.focus.duration;
            }
            else
                throw new Error(t('计时操作不正确'));
            break;
        }
        case 'snooze': {
            const r = next.reminders.find(x => x.id === (0, validation_js_1.validId)(a.id));
            if (!r)
                throw new Error(t('找不到待稍后提醒的计划'));
            if (next.reminders.length >= 200)
                throw new Error(t('计划数量已达上限'));
            const d = new Date(Date.now() + 5 * 60_000);
            next.reminders.push({ ...r, id: (0, node_crypto_1.randomUUID)(), title: r.title.slice(0, 60 - t(' · 稍后').length) + t(' · 稍后'), date: (0, schedule_js_1.dayKey)(d), time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, repeat: 'once', completed: false, enabled: true });
            break;
        }
        default: throw new Error(t('不支持的操作'));
    }
    store.save(next);
    syncPet();
    updateTray();
    broadcast();
    return snapshot();
}
function handle(channel, fn) {
    electron_1.ipcMain.handle(channel, async (event, ...args) => { ensure(event); try {
        return { ok: true, value: await fn(...args) };
    }
    catch (error) {
        return { ok: false, error: error instanceof Error ? t(error.message) : t('操作没有完成，请重试') };
    } });
}
function updateTray() { if (!tray)
    return; tray.setToolTip(t('PixelStella · 提醒需要应用保持运行')); tray.setContextMenu(electron_1.Menu.buildFromTemplate([{ label: t('打开PixelStella'), click: showPanel }, { label: t('显示桌宠'), click: () => changePet(true) }, { type: 'separator' }, { label: t('退出PixelStella'), click: () => electron_1.app.quit() }])); panel?.setTitle(t('PixelStella · 角色与学习计划')); }
async function createWindows() {
    const icon = node_path_1.default.resolve(__dirname, '../../../assets/icon.png');
    const prefs = { preload: node_path_1.default.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, spellcheck: false };
    panel = new electron_1.BrowserWindow({ width: 1230, height: 850, minWidth: 830, minHeight: 640, title: t('PixelStella · 角色与学习计划'), backgroundColor: '#f7f7f2', icon, webPreferences: prefs, show: false });
    const area = electron_1.screen.getPrimaryDisplay().workArea;
    pet = new electron_1.BrowserWindow({ width: 234, height: 320, x: area.x + area.width - 270, y: area.y + area.height - 350, frame: false, transparent: true, resizable: false, skipTaskbar: true, alwaysOnTop: true, hasShadow: false, webPreferences: prefs, show: false });
    panel.removeMenu();
    pet.removeMenu();
    for (const window of [panel, pet]) {
        window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
        window.webContents.on('will-navigate', (event) => event.preventDefault());
    }
    panel.on('close', event => { if (!quitting) {
        event.preventDefault();
        panel.hide();
    } });
    pet.on('close', event => { if (!quitting) {
        event.preventDefault();
        pet.hide();
    } });
    pet.webContents.on('context-menu', () => electron_1.Menu.buildFromTemplate([{ label: t('打开角色与计划'), click: showPanel }, { label: t('暂时收起桌宠'), click: () => changePet(false) }, { type: 'separator' }, { label: t('退出PixelStella'), click: () => electron_1.app.quit() }]).popup({ window: pet }));
    tray = new electron_1.Tray(electron_1.nativeImage.createFromPath(icon));
    updateTray();
    tray.on('double-click', showPanel);
    await Promise.all([panel.loadURL(panelURL), pet.loadURL(petURL)]);
    panel.show();
    syncPet();
}
if (locked)
    void electron_1.app.whenReady().then(async () => {
        if (process.env.PIXELSTELLA_TEST !== '1')
            try {
                (0, migration_js_1.copyLegacyProfile)(node_path_1.default.join(electron_1.app.getPath('appData'), 'Xingban'), electron_1.app.getPath('userData'));
            }
            catch {
                electron_1.dialog.showErrorBox(t('旧版资料迁移未完成'), t('未替换任何已有存档。请先备份 %APPDATA%\\Xingban 和 %APPDATA%\\PixelStella，检查旧存档格式、图片冲突及目录权限后重试。不要删除原始资料。'));
                electron_1.app.quit();
                return;
            }
        store = new storage_js_1.Store(electron_1.app.getPath('userData'));
        electron_1.session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
        electron_1.ipcMain.handle('snapshot', event => { ensure(event); return snapshot(); });
        handle('dispatch', dispatch);
        handle('import-image', async () => { const choice = await electron_1.dialog.showOpenDialog(panel, { title: t('选择本地角色图片'), filters: [{ name: t('角色图片'), extensions: ['png', 'jpg', 'jpeg', 'webp'] }], properties: ['openFile'] }); if (choice.canceled || !choice.filePaths[0])
            return null; const p = choice.filePaths[0]; if (node_fs_1.default.statSync(p).size > 8_000_000)
            throw new Error(t('图片不得超过 8 MB')); const id = storeImage(node_fs_1.default.readFileSync(p)); return dispatch({ type: 'avatar', value: { ...store.value.avatar, mode: 'image', assetId: id } }); });
        handle('export-avatar', async (raster) => {
            const a = store.value.avatar;
            let data;
            if (a.mode === 'custom') {
                if (typeof raster !== 'string' || raster.length > 3_000_000 || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(raster))
                    throw new Error(t('头像导出数据不正确，请从角色工坊重试'));
                const image = electron_1.nativeImage.createFromBuffer(Buffer.from(raster.split(',')[1], 'base64'));
                if (image.isEmpty() || image.getSize().width > 1024 || image.getSize().height > 1024)
                    throw new Error(t('导出图片格式或尺寸不正确'));
                data = image.toPNG();
            }
            else {
                const image = imageData();
                if (!image)
                    throw new Error(t('角色图片已丢失'));
                data = Buffer.from(image.split(',')[1], 'base64');
            }
            const choice = await electron_1.dialog.showSaveDialog(panel, { defaultPath: `${a.name.replace(/[^\p{L}\p{N}_-]/gu, '_')}.png`, filters: [{ name: t('PNG 角色图片'), extensions: ['png'] }] });
            if (choice.canceled || !choice.filePath)
                return false;
            node_fs_1.default.writeFileSync(choice.filePath, data);
            return true;
        });
        handle('export-plans', async () => { const choice = await electron_1.dialog.showSaveDialog(panel, { defaultPath: t('PixelStella学习计划.json'), filters: [{ name: t('学习计划 JSON'), extensions: ['json'] }] }); if (choice.canceled || !choice.filePath)
            return false; node_fs_1.default.writeFileSync(choice.filePath, JSON.stringify({ version: 1, reminders: store.value.reminders }, null, 2), 'utf8'); return true; });
        handle('test-ai', () => (0, ai_js_1.testAI)(store.value.settings.aiBase));
        handle('generate-ai', async (prompt) => { if (aiBusy)
            throw new Error(t('已有一项生成正在进行，请等待完成')); aiBusy = true; try {
            const bytes = await (0, ai_js_1.generateAI)(store.value.settings.aiBase, prompt);
            const id = storeImage(bytes);
            return await dispatch({ type: 'avatar', value: { ...store.value.avatar, mode: 'image', assetId: id } });
        }
        finally {
            aiBusy = false;
        } });
        for (const [channel, fn] of [['open-panel', showPanel], ['hide-pet', () => changePet(false)], ['quit', () => electron_1.app.quit()]])
            electron_1.ipcMain.on(channel, event => { try {
                ensure(event);
                fn();
            }
            catch { } });
        await createWindows();
        setInterval(tick, 1000);
        setTimeout(tick, 1200);
    }).catch(() => { electron_1.dialog.showErrorBox(t('PixelStella启动失败'), t('无法初始化本地窗口或数据目录，请检查文件权限后重试。')); electron_1.app.quit(); });
electron_1.app.on('before-quit', () => { quitting = true; });
electron_1.app.on('window-all-closed', () => { });
electron_1.app.on('second-instance', () => { if (panel && !panel.isDestroyed())
    showPanel(); });
