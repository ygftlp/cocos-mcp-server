import { randomBytes, createHash } from 'crypto';
import { EventEmitter } from 'events';
import * as net from 'net';
import * as tls from 'tls';
import { URL } from 'url';

class RawWebSocket extends EventEmitter {
    private socket: net.Socket | tls.TLSSocket | null = null;
    private buffer = Buffer.alloc(0);
    private connected = false;
    private fragmentedOpcode: number | null = null;
    private fragments: Buffer[] = [];

    async connect(rawUrl: string, timeoutMs = 10000): Promise<void> {
        if (this.socket) throw new Error('WebSocket is already connected');
        const url = new URL(rawUrl);
        if (url.protocol !== 'ws:' && url.protocol !== 'wss:') throw new Error(`Unsupported WebSocket protocol: ${url.protocol}`);
        const secure = url.protocol === 'wss:';
        const port = Number(url.port || (secure ? 443 : 80));
        const host = url.hostname;
        const key = randomBytes(16).toString('base64');
        const expectedAccept = createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
        const requestPath = `${url.pathname || '/'}${url.search || ''}`;

        await new Promise<void>((resolve, reject) => {
            let settled = false;
            const finish = (callback: () => void) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                callback();
            };
            const timer = setTimeout(() => finish(() => reject(new Error(`WebSocket handshake timed out after ${timeoutMs}ms`))), timeoutMs);
            const socket = secure ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
            this.socket = socket;
            socket.setNoDelay(true);
            socket.once('error', (error) => finish(() => reject(error)));
            socket.once('connect', () => {
                const request = [
                    `GET ${requestPath} HTTP/1.1`,
                    `Host: ${url.host}`,
                    'Upgrade: websocket',
                    'Connection: Upgrade',
                    `Sec-WebSocket-Key: ${key}`,
                    'Sec-WebSocket-Version: 13',
                    '\r\n'
                ].join('\r\n');
                socket.write(request);
            });
            const onHandshakeData = (chunk: Buffer) => {
                this.buffer = Buffer.concat([this.buffer, chunk]);
                const boundary = this.buffer.indexOf('\r\n\r\n');
                if (boundary < 0) return;
                const header = this.buffer.subarray(0, boundary).toString('utf8');
                const remaining = this.buffer.subarray(boundary + 4);
                const lines = header.split('\r\n');
                if (!/^HTTP\/1\.1 101\b/.test(lines[0])) {
                    finish(() => reject(new Error(`WebSocket upgrade failed: ${lines[0] || 'empty response'}`)));
                    socket.destroy();
                    return;
                }
                const headers = new Map<string, string>();
                for (const line of lines.slice(1)) {
                    const index = line.indexOf(':');
                    if (index > 0) headers.set(line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim());
                }
                if (headers.get('sec-websocket-accept') !== expectedAccept) {
                    finish(() => reject(new Error('Invalid WebSocket accept key')));
                    socket.destroy();
                    return;
                }
                socket.removeListener('data', onHandshakeData);
                this.buffer = remaining;
                this.connected = true;
                socket.on('data', (data) => this.handleFrameData(data));
                socket.on('error', (error) => this.emit('error', error));
                socket.on('close', () => {
                    this.connected = false;
                    this.emit('close');
                });
                finish(resolve);
                if (this.buffer.length) this.parseFrames();
            };
            socket.on('data', onHandshakeData);
        });
    }

    sendText(text: string): void {
        if (!this.connected || !this.socket) throw new Error('WebSocket is not connected');
        this.sendFrame(0x1, Buffer.from(text, 'utf8'));
    }

    close(): void {
        if (!this.socket) return;
        if (this.connected) {
            try { this.sendFrame(0x8, Buffer.alloc(0)); } catch { /* ignore */ }
        }
        this.socket.destroy();
        this.socket = null;
        this.connected = false;
    }

    private handleFrameData(chunk: Buffer): void {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.parseFrames();
    }

    private parseFrames(): void {
        while (this.buffer.length >= 2) {
            const first = this.buffer[0];
            const second = this.buffer[1];
            const fin = Boolean(first & 0x80);
            const opcode = first & 0x0f;
            const masked = Boolean(second & 0x80);
            let length = second & 0x7f;
            let offset = 2;
            if (length === 126) {
                if (this.buffer.length < offset + 2) return;
                length = this.buffer.readUInt16BE(offset);
                offset += 2;
            } else if (length === 127) {
                if (this.buffer.length < offset + 8) return;
                const largeLength = this.buffer.readBigUInt64BE(offset);
                if (largeLength > BigInt(Number.MAX_SAFE_INTEGER)) {
                    this.emit('error', new Error('WebSocket frame exceeds safe integer length'));
                    this.close();
                    return;
                }
                length = Number(largeLength);
                offset += 8;
            }
            const maskLength = masked ? 4 : 0;
            if (this.buffer.length < offset + maskLength + length) return;
            const mask = masked ? this.buffer.subarray(offset, offset + 4) : null;
            offset += maskLength;
            const payload = Buffer.from(this.buffer.subarray(offset, offset + length));
            this.buffer = this.buffer.subarray(offset + length);
            if (mask) for (let index = 0; index < payload.length; index++) payload[index] ^= mask[index % 4];
            this.handleFrame(opcode, fin, payload);
        }
    }

    private handleFrame(opcode: number, fin: boolean, payload: Buffer): void {
        if (opcode === 0x8) {
            this.close();
            return;
        }
        if (opcode === 0x9) {
            if (this.socket && this.connected) this.sendFrame(0xA, payload);
            return;
        }
        if (opcode === 0xA) return;
        if (opcode === 0x0) {
            if (this.fragmentedOpcode === null) return;
            this.fragments.push(payload);
            if (fin) {
                const messageOpcode = this.fragmentedOpcode;
                const message = Buffer.concat(this.fragments);
                this.fragmentedOpcode = null;
                this.fragments = [];
                this.emitMessage(messageOpcode, message);
            }
            return;
        }
        if (!fin) {
            this.fragmentedOpcode = opcode;
            this.fragments = [payload];
            return;
        }
        this.emitMessage(opcode, payload);
    }

    private emitMessage(opcode: number, payload: Buffer): void {
        if (opcode === 0x1) this.emit('message', payload.toString('utf8'));
        else if (opcode === 0x2) this.emit('binary', payload);
    }

    private sendFrame(opcode: number, payload: Buffer): void {
        if (!this.socket) throw new Error('WebSocket socket is unavailable');
        const mask = randomBytes(4);
        let header: Buffer;
        if (payload.length < 126) {
            header = Buffer.alloc(2);
            header[1] = 0x80 | payload.length;
        } else if (payload.length <= 0xffff) {
            header = Buffer.alloc(4);
            header[1] = 0x80 | 126;
            header.writeUInt16BE(payload.length, 2);
        } else {
            header = Buffer.alloc(10);
            header[1] = 0x80 | 127;
            header.writeBigUInt64BE(BigInt(payload.length), 2);
        }
        header[0] = 0x80 | opcode;
        const maskedPayload = Buffer.alloc(payload.length);
        for (let index = 0; index < payload.length; index++) maskedPayload[index] = payload[index] ^ mask[index % 4];
        this.socket.write(Buffer.concat([header, mask, maskedPayload]));
    }
}

export interface CdpEvent {
    method: string;
    params?: any;
}

export class CdpClient {
    private readonly socket = new RawWebSocket();
    private nextId = 1;
    private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();
    private eventListeners = new Set<(event: CdpEvent) => void>();

    async connect(webSocketUrl: string, timeoutMs = 10000): Promise<void> {
        this.socket.on('message', (text: string) => this.handleMessage(text));
        this.socket.on('error', (error: Error) => this.failAll(error));
        this.socket.on('close', () => this.failAll(new Error('Chrome DevTools connection closed')));
        await this.socket.connect(webSocketUrl, timeoutMs);
    }

    onEvent(listener: (event: CdpEvent) => void): () => void {
        this.eventListeners.add(listener);
        return () => this.eventListeners.delete(listener);
    }

    command(method: string, params: any = {}, timeoutMs = 15000): Promise<any> {
        const id = this.nextId++;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`CDP command timed out: ${method}`));
            }, timeoutMs);
            this.pending.set(id, { resolve, reject, timer });
            try {
                this.socket.sendText(JSON.stringify({ id, method, params }));
            } catch (error: any) {
                clearTimeout(timer);
                this.pending.delete(id);
                reject(error);
            }
        });
    }

    close(): void {
        this.socket.close();
        this.failAll(new Error('Chrome DevTools connection closed'));
    }

    private handleMessage(text: string): void {
        let message: any;
        try { message = JSON.parse(text); } catch { return; }
        if (typeof message.id === 'number') {
            const pending = this.pending.get(message.id);
            if (!pending) return;
            clearTimeout(pending.timer);
            this.pending.delete(message.id);
            if (message.error) pending.reject(new Error(`${message.error.message || 'CDP error'}${message.error.data ? `: ${message.error.data}` : ''}`));
            else pending.resolve(message.result);
            return;
        }
        if (typeof message.method === 'string') {
            const event = { method: message.method, params: message.params };
            for (const listener of this.eventListeners) {
                try { listener(event); } catch { /* isolate listeners */ }
            }
        }
    }

    private failAll(error: Error): void {
        for (const pending of this.pending.values()) {
            clearTimeout(pending.timer);
            pending.reject(error);
        }
        this.pending.clear();
    }
}
