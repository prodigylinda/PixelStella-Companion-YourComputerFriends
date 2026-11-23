"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const models_js_1 = require("../shared/models.js");
const validation_js_1 = require("../shared/validation.js");
class Store {
    directory;
    value;
    warning = null;
    blocked = false;
    file;
    constructor(directory) {
        this.directory = directory;
        node_fs_1.default.mkdirSync(directory, { recursive: true });
        this.file = node_path_1.default.join(directory, 'state.json');
        this.value = (0, models_js_1.initialState)();
        if (node_fs_1.default.existsSync(this.file))
            try {
                if (node_fs_1.default.statSync(this.file).size > 1_500_000)
                    throw new Error();
                this.value = (0, validation_js_1.state)(JSON.parse(node_fs_1.default.readFileSync(this.file, 'utf8')));
            }
            catch {
                this.blocked = true;
                this.warning = '本地存档无法读取，已暂停保存并保留原文件。请先退出应用，备份数据目录后修复 state.json；不会静默覆盖原存档。';
            }
    }
    save(next) {
        if (this.blocked)
            throw new Error('存档读取异常，已暂停写入。请先备份并修复本地存档。');
        const valid = (0, validation_js_1.state)(next), tmp = node_path_1.default.join(this.directory, `.state-${(0, node_crypto_1.randomUUID)()}.tmp`);
        try {
            node_fs_1.default.writeFileSync(tmp, JSON.stringify(valid, null, 2), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
            node_fs_1.default.renameSync(tmp, this.file);
            this.value = valid;
            this.warning = null;
        }
        catch {
            try {
                node_fs_1.default.unlinkSync(tmp);
            }
            catch { }
            this.warning = '本地保存失败，操作未完成。请检查磁盘空间与目录权限。';
            throw new Error(this.warning);
        }
    }
}
exports.Store = Store;
