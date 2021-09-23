/// <reference types="node" />
import { EventEmitter as NativeEmitter } from "events";
export declare class EventEmitter extends NativeEmitter {
    on(event: string | symbol, listener: (...args: any) => void): this;
    off(event: string | symbol, listener: (...args: any) => void): this;
    once(event: string | symbol, listener: (...args: any) => void): this;
    addListener(event: string | symbol, listener: (...args: any) => void): this;
    removeListener(event: string | symbol, listener: (...args: any) => void): this;
    private ensureListenerCount;
}
