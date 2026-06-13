'use strict';

const assert = require('assert');
const crypto = require('crypto');
const net = require('net');
const path = require('path');

const projectPath = path.join(process.cwd(), '.tmp-runtime-project');
global.Editor = global.Editor || {
    Project: { path: projectPath, name: 'runtime-test', uuid: 'runtime-test' },
    App: { path: process.cwd() },
    Message: { request: async () => { throw new Error('Editor API unavailable in runtime tests'); }, send: () => undefined },
    Panel: { open: () => undefined },
    versions: { cocos: '3.8.8' }
};

const { CdpClient } = require('../dist/runtime/cdp-client');
const { RuntimeCoreTools } = require('../dist/tools/core-runtime-tools');
const { RuntimeTools } = require('../dist/tools/runtime-tools');
const { selectCocosAdapter } = require('../dist/adapters/selector');

function encodeServerFrame(payload, opcode = 1, fin = true) {
    const body = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
    let header;
    if (body.length < 126) {
        header = Buffer.from([(fin ? 0x80 : 0) | opcode, body.length]);
    } else if (body.length <= 0xffff) {
        header = Buffer.alloc(4);
        header[0] = (fin ? 0x80 : 0) | opcode;
        header[1] = 126;
        header.writeUInt16BE(body.length, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = (fin ? 0x80 : 0) | opcode;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(body.length), 2);
    }
    return Buffer.concat([header, body]);
}

function parseClientFrame(buffer) {
    if (buffer.length < 2) return null;
    const opcode = buffer[0] & 0x0f;
    let length = buffer[1] & 0x7f;
    const masked = Boolean(buffer[1] & 0x80);
    let offset = 2;
    if (length === 126) {
        if (buffer.length < 4) return null;
        length = buffer.readUInt16BE(2);
        offset = 4;
    } else if (length === 127) {
        if (buffer.length < 10) return null;
        length = Number(buffer.readBigUInt64BE(2));
        offset = 10;
    }
    if (!masked || buffer.length < offset + 4 + length) return null;
    const mask = buffer.subarray(offset, offset + 4);
    offset += 4;
    const payload = Buffer.from(buffer.subarray(offset, offset + length));
    for (let index = 0; index < payload.length; index++) payload[index] ^= mask[index % 4];
    return { opcode, payload, consumed: offset + length };
}

async function createMockCdpServer() {
    const server = net.createServer();
    const commands = [];
    let socketRef;
    server.on('connection', (socket) => {
        socketRef = socket;
        let handshake = Buffer.alloc(0);
        let frames = Buffer.alloc(0);
        let upgraded = false;
        socket.on('data', (chunk) => {
            if (!upgraded) {
                handshake = Buffer.concat([handshake, chunk]);
                const boundary = handshake.indexOf('\r\n\r\n');
                if (boundary < 0) return;
                const header = handshake.subarray(0, boundary).toString('utf8');
                const keyLine = header.split('\r\n').find((line) => line.toLowerCase().startsWith('sec-websocket-key:'));
                const key = keyLine.split(':').slice(1).join(':').trim();
                const accept = crypto.createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
                socket.write([
                    'HTTP/1.1 101 Switching Protocols',
                    'Upgrade: websocket',
                    'Connection: Upgrade',
                    `Sec-WebSocket-Accept: ${accept}`,
                    '\r\n'
                ].join('\r\n'));
                upgraded = true;
                frames = handshake.subarray(boundary + 4);
            } else {
                frames = Buffer.concat([frames, chunk]);
            }
            while (upgraded) {
                const frame = parseClientFrame(frames);
                if (!frame) break;
                frames = frames.subarray(frame.consumed);
                if (frame.opcode !== 1) continue;
                const message = JSON.parse(frame.payload.toString('utf8'));
                commands.push(message);
                socket.write(encodeServerFrame(JSON.stringify({ id: message.id, result: { acknowledged: message.method } })));
            }
        });
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const port = server.address().port;
    return {
        url: `ws://127.0.0.1:${port}/devtools/page/test`,
        commands,
        sendFragmentedEvent(event) {
            const payload = Buffer.from(JSON.stringify(event), 'utf8');
            const split = Math.max(1, Math.floor(payload.length / 2));
            socketRef.write(encodeServerFrame(payload.subarray(0, split), 1, false));
            socketRef.write(encodeServerFrame(payload.subarray(split), 0, true));
        },
        async close() {
            if (socketRef) socketRef.destroy();
            await new Promise((resolve) => server.close(resolve));
        }
    };
}

async function testCdpTransport() {
    const mock = await createMockCdpServer();
    const client = new CdpClient();
    const events = [];
    try {
        client.onEvent((event) => events.push(event));
        await client.connect(mock.url, 3000);
        const result = await client.command('Runtime.enable', {}, 3000);
        assert.strictEqual(result.acknowledged, 'Runtime.enable');
        assert.strictEqual(mock.commands[0].method, 'Runtime.enable');
        mock.sendFragmentedEvent({ method: 'Runtime.consoleAPICalled', params: { type: 'log' } });
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert.strictEqual(events[0].method, 'Runtime.consoleAPICalled');
    } finally {
        client.close();
        await mock.close();
    }
}

async function testRuntimeTools() {
    const calls = [];
    let running = false;
    const session = () => ({
        running,
        sessionId: running ? 'session-1' : null,
        url: running ? 'http://127.0.0.1:4000/' : null,
        buildPath: running ? '/project/build/web-desktop' : null,
        browserPath: running ? '/browser' : null,
        serverPort: running ? 4000 : null,
        debuggerPort: running ? 9222 : null,
        startedAt: running ? '2026-06-13T00:00:00.000Z' : null,
        pid: running ? 123 : null
    });
    const fake = {
        start: async (options) => { calls.push(['start', options]); running = true; return session(); },
        stop: async () => { calls.push(['stop']); running = false; return session(); },
        status: async () => session(),
        reload: async (ignoreCache) => calls.push(['reload', ignoreCache]),
        evaluate: async (expression, awaitPromise) => { calls.push(['evaluate', expression, awaitPromise]); return 3; },
        waitFor: async (expression, timeoutMs, intervalMs) => { calls.push(['waitFor', expression, timeoutMs, intervalMs]); return { ready: true }; },
        screenshot: async (options) => { calls.push(['screenshot', options]); return { base64: Buffer.from('image').toString('base64'), mimeType: 'image/png', filePath: '/project/.cocos-mcp/runtime-artifacts/test.png' }; },
        mouse: async (input) => calls.push(['mouse', input]),
        keyboard: async (input) => calls.push(['keyboard', input]),
        touch: async (input) => calls.push(['touch', input]),
        logs: async () => ({ entries: [
            { sequence: 1, timestamp: 'x', level: 'info', source: 'console', text: 'ready' },
            { sequence: 2, timestamp: 'x', level: 'error', source: 'exception', text: 'boom' }
        ], nextSequence: 3 })
    };
    const tools = new RuntimeTools(fake);
    const started = await tools.execute('runtime_start', { buildPath: 'build/web-desktop', headless: true });
    assert.strictEqual(started.success, true);
    assert.strictEqual(started.data.running, true);
    assert.strictEqual(calls[0][0], 'start');

    const evaluation = await tools.execute('runtime_evaluate', { expression: '1 + 2' });
    assert.strictEqual(evaluation.data.value, 3);
    const wait = await tools.execute('runtime_wait_for', { expression: 'window.ready', timeoutMs: 5000 });
    assert.strictEqual(wait.data.matched, true);

    const shot = await tools.execute('runtime_screenshot', { filePath: 'test.png', returnBase64: false });
    assert.strictEqual(shot.success, true);
    assert.strictEqual(shot.data.bytes, 5);
    assert.strictEqual(shot.data.base64, undefined);

    const logs = await tools.execute('runtime_logs', { levels: ['error'], limit: 10 });
    assert.strictEqual(logs.data.count, 1);
    assert.strictEqual(logs.data.entries[0].text, 'boom');

    assert.strictEqual((await tools.execute('runtime_mouse', { type: 'click', x: 10, y: 20 })).success, true);
    assert.strictEqual((await tools.execute('runtime_keyboard', { type: 'press', key: 'Space' })).success, true);
    assert.strictEqual((await tools.execute('runtime_touch', { type: 'tap', points: [{ x: 20, y: 30 }] })).success, true);
    assert.strictEqual((await tools.execute('runtime_reload', { ignoreCache: false })).success, true);
    assert.strictEqual((await tools.execute('runtime_stop', {})).data.running, false);

    const core = new RuntimeCoreTools(fake);
    const definitions = core.getTools();
    assert.deepStrictEqual(definitions.map((tool) => tool.name), ['session', 'observe', 'input']);
    assert.strictEqual(definitions[0].xCocos.requires[0], 'runtime.write');
    assert.strictEqual(definitions[1].xCocos.requires[0], 'runtime.read');
    assert.strictEqual(definitions[2].xCocos.requires[0], 'runtime.write');
    for (const definition of definitions) assert.ok(definition.inputSchema.oneOf.length > 0);

    const stable = selectCocosAdapter('3.8.8');
    assert.strictEqual(stable.runtime.constructor.name, 'Creator38xRuntimeAdapter');
    const preview = selectCocosAdapter('3.9.0');
    await assert.rejects(() => preview.runtime.status(), /unavailable/);
}

async function main() {
    await testCdpTransport();
    await testRuntimeTools();
    console.log('Web runtime harness contract tests passed.');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
