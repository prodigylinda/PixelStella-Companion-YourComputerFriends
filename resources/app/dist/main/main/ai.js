"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAI = testAI;
exports.generateAI = generateAI;
const validation_js_1 = require("../shared/validation.js");
async function request(base, route, body) {
    const url = (0, validation_js_1.localAIBase)(base) + route;
    try {
        const response = await fetch(url, { method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(body ? 120_000 : 6_000), headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
        if (!response.ok)
            throw new Error('http');
        const reader = response.body?.getReader();
        if (!reader)
            throw new Error('body');
        const chunks = [];
        let size = 0;
        try {
            while (true) {
                const r = await reader.read();
                if (r.done)
                    break;
                size += r.value.length;
                if (size > 22_000_000)
                    throw new Error('size');
                chunks.push(r.value);
            }
        }
        finally {
            await reader.cancel().catch(() => { });
        }
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    catch {
        throw new Error(body ? '本机 AI 生成未完成。请检查服务、模型、API 是否启用，或等待时限是否足够；没有切换为预设图。' : '未连接到兼容的本机 AI 服务。请启动带 --api 的 Stable Diffusion WebUI，并核对地址。');
    }
}
async function testAI(base) {
    const value = await request(base, '/sdapi/v1/sd-models');
    if (!Array.isArray(value) || !value.some(x => x && typeof x === 'object' && typeof x.model_name === 'string'))
        throw new Error('接口已响应，但没有可用模型。请在本机服务安装并加载模型。');
    return '本机接口返回了模型列表。实际生成效果与可用性仍取决于你安装的模型；这不是云端服务。';
}
async function generateAI(base, prompt) {
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 1000)
        throw new Error('请填写 1 至 1000 字的角色描述');
    const value = await request(base, '/sdapi/v1/txt2img', { prompt: `${prompt.trim()}, chibi character, full body, centered, simple background, cute illustration`, negative_prompt: 'text, watermark, multiple characters', width: 512, height: 512, steps: 20, batch_size: 1, n_iter: 1 });
    if (!value || typeof value !== 'object' || !('images' in value) || !Array.isArray(value.images) || typeof value.images[0] !== 'string')
        throw new Error('本机 AI 没有返回有效图片；未使用替代图片。');
    const encoded = value.images[0].replace(/^data:image\/(png|jpeg);base64,/, '');
    if (!/^[A-Za-z0-9+/=\r\n]+$/.test(encoded))
        throw new Error('本机 AI 返回的图片编码不正确');
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length > 8_000_000)
        throw new Error('生成图片超过 8 MB 限制');
    return bytes;
}
