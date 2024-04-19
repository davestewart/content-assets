import type { Callback } from '../../types';
export interface Logger {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
}
export declare function createWebSocket(url: string, logger?: Logger): {
    connect: (retry?: boolean) => void;
    send: (data: any) => void;
    addHandler(callback: Callback): void;
} | null;
