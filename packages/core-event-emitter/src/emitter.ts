import { EventEmitter as NativeEmitter } from "events";

export class EventEmitter {
    private readonly emitter: NativeEmitter = new NativeEmitter();

    public emit(event: string | symbol, args: any): boolean {
        return this.emitter.emit(event, args);
    }

    public on(event: string | symbol, listener: (...args: any) => void): void {
        this.ensureListenerCount(event, maxListeners => maxListeners + 1);

        this.emitter.on(event, listener);
    }

    public once(event: string | symbol, listener: (...args: any) => void): void {
        this.ensureListenerCount(event, maxListeners => maxListeners + 1);

        this.emitter.once(event, listener);
    }

    public off(event: string | symbol, listener: (...args: any) => void): void {
        this.emitter.off(event, listener);

        this.ensureListenerCount(event, maxListeners => maxListeners - 1);
    }

    private ensureListenerCount(event: string | symbol, count: (maxListeners: number) => number): void {
        const maxListeners = this.emitter.getMaxListeners();
        const listenerCount = this.emitter.listenerCount(event);

        if (listenerCount >= maxListeners) {
            this.emitter.setMaxListeners(count(maxListeners));
        }
    }
}
