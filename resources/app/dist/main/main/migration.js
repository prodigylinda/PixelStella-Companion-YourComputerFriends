"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyLegacyProfile = copyLegacyProfile;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const validation_js_1 = require("../shared/validation.js");
/** Copy the legacy save and referenced avatar only. Never alter legacy files or overwrite a destination. */
function copyLegacyProfile(legacy, destination) {
    const oldFile = node_path_1.default.join(legacy, 'state.json'), newFile = node_path_1.default.join(destination, 'state.json');
    if (node_fs_1.default.existsSync(newFile) || !node_fs_1.default.existsSync(oldFile))
        return false;
    if (node_fs_1.default.statSync(oldFile).size > 1_500_000)
        throw new Error('Legacy save is too large. Back up the legacy profile before repairing it.');
    const bytes = node_fs_1.default.readFileSync(oldFile), state = (0, validation_js_1.state)(JSON.parse(bytes.toString('utf8')));
    const id = state.avatar.assetId;
    if (id) {
        const source = node_path_1.default.join(legacy, 'assets', id + '.png'), target = node_path_1.default.join(destination, 'assets', id + '.png');
        if (node_fs_1.default.existsSync(source)) {
            if (node_fs_1.default.lstatSync(source).isSymbolicLink() || node_fs_1.default.statSync(source).size > 8_000_000)
                throw new Error('Legacy avatar cannot be copied safely.');
            const image = node_fs_1.default.readFileSync(source);
            node_fs_1.default.mkdirSync(node_path_1.default.dirname(target), { recursive: true });
            if (node_fs_1.default.existsSync(target)) {
                if (!node_fs_1.default.readFileSync(target).equals(image))
                    throw new Error('Legacy avatar conflicts with existing data. No save was replaced.');
            }
            else
                node_fs_1.default.writeFileSync(target, image, { flag: 'wx', mode: 0o600 });
        }
    }
    node_fs_1.default.mkdirSync(destination, { recursive: true });
    node_fs_1.default.writeFileSync(newFile, bytes, { flag: 'wx', mode: 0o600 });
    return true;
}
