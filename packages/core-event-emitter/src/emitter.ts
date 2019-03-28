import { EventEmitter as NativeEmitter } from "events";

export class EventEmitter {
    private readonly emitter: NativeEmitter = new NativeEmitter();

    public emit(event: string | symbol, args: any): boolean {
        return this.emitter.emit(event, args);
    }

    public on(event: string | symbol, listener: (...args: any) => void): void {
        this.ensureMaxListenerCount(event);

        this.emitter.on(event, listener);
    }

    public once(event: string | symbol, listener: (...args: any) => void): void {
        this.ensureMaxListenerCount(event);

        this.emitter.once(event, listener);
    }

    private ensureMaxListenerCount(event): void {
        const maxListeners = this.emitter.getMaxListeners();
        const listenerCount = this.emitter.listenerCount(event);

        if (listenerCount >= maxListeners) {
            this.emitter.setMaxListeners(maxListeners + 1);
        }
    }
}
