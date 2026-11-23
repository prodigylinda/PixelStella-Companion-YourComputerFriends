"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const bridge = {
    snapshot: () => electron_1.ipcRenderer.invoke('snapshot'), dispatch: action => electron_1.ipcRenderer.invoke('dispatch', action),
    importImage: () => electron_1.ipcRenderer.invoke('import-image'), exportAvatar: png => electron_1.ipcRenderer.invoke('export-avatar', png), exportPlans: () => electron_1.ipcRenderer.invoke('export-plans'),
    generateAI: prompt => electron_1.ipcRenderer.invoke('generate-ai', prompt), testAI: () => electron_1.ipcRenderer.invoke('test-ai'),
    openPanel: () => electron_1.ipcRenderer.send('open-panel'), hidePet: () => electron_1.ipcRenderer.send('hide-pet'), quit: () => electron_1.ipcRenderer.send('quit'),
    onState: callback => { const handler = (_, v) => callback(v); electron_1.ipcRenderer.on('state', handler); return () => electron_1.ipcRenderer.removeListener('state', handler); },
    onAlert: callback => { const handler = (_, v) => callback(v); electron_1.ipcRenderer.on('alert', handler); return () => electron_1.ipcRenderer.removeListener('alert', handler); }
};
electron_1.contextBridge.exposeInMainWorld('pixelStella', bridge);
