export type RuntimeLogLevel = 'debug' | 'info' | 'warning' | 'error';

export interface RuntimeStartOptions {
    buildPath?: string;
    browserPath?: string;
    headless?: boolean;
    width?: number;
    height?: number;
    host?: string;
    port?: number;
    startupTimeoutMs?: number;
    extraBrowserArgs?: string[];
}

export interface RuntimeSessionInfo {
    running: boolean;
    sessionId: string | null;
    url: string | null;
    buildPath: string | null;
    browserPath: string | null;
    serverPort: number | null;
    debuggerPort: number | null;
    startedAt: string | null;
    pid: number | null;
}

export interface RuntimeLogEntry {
    sequence: number;
    timestamp: string;
    level: RuntimeLogLevel;
    source: string;
    text: string;
    details?: any;
}

export interface RuntimeScreenshotOptions {
    format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
    filePath?: string;
    fullPage?: boolean;
}

export interface RuntimeMouseInput {
    type: 'move' | 'down' | 'up' | 'click' | 'wheel';
    x: number;
    y: number;
    button?: 'none' | 'left' | 'middle' | 'right';
    clickCount?: number;
    deltaX?: number;
    deltaY?: number;
}

export interface RuntimeKeyboardInput {
    type: 'keyDown' | 'keyUp' | 'char' | 'press';
    key: string;
    code?: string;
    text?: string;
    modifiers?: number;
}

export interface RuntimeTouchPoint {
    x: number;
    y: number;
    radiusX?: number;
    radiusY?: number;
    force?: number;
    id?: number;
}

export interface RuntimeTouchInput {
    type: 'touchStart' | 'touchMove' | 'touchEnd' | 'tap';
    points: RuntimeTouchPoint[];
}

export interface RuntimeAdapter {
    start(options?: RuntimeStartOptions): Promise<RuntimeSessionInfo>;
    stop(): Promise<RuntimeSessionInfo>;
    status(): Promise<RuntimeSessionInfo>;
    reload(ignoreCache?: boolean): Promise<void>;
    evaluate(expression: string, awaitPromise?: boolean): Promise<any>;
    waitFor(expression: string, timeoutMs?: number, intervalMs?: number): Promise<any>;
    screenshot(options?: RuntimeScreenshotOptions): Promise<{ base64: string; mimeType: string; filePath?: string }>;
    mouse(input: RuntimeMouseInput): Promise<void>;
    keyboard(input: RuntimeKeyboardInput): Promise<void>;
    touch(input: RuntimeTouchInput): Promise<void>;
    logs(sinceSequence?: number, clear?: boolean): Promise<{ entries: RuntimeLogEntry[]; nextSequence: number }>;
}
