import { EventEmitter as NativeEmitter } from "events";

export class EventEmitter extends NativeEmitter {
    public on(event: string | symbol, listener: (...args: any) => void): this {
        this.ensureListenerCount(event, (maxListeners: number) => maxListeners + 1);

        return super.on(event, listener);
    }

    public off(event: string | symbol, listener: (...args: any) => void): this {
        return this.removeListener(event, listener);
    }

    public once(event: string | symbol, listener: (...args: any) => void): this {
        this.ensureListenerCount(event, (maxListeners: number) => maxListeners + 1);

        return super.once(event, listener);
    }

    public addListener(event: string | symbol, listener: (...args: any) => void): this {
        return this.on(event, listener);
    }

    public removeListener(event: string | symbol, listener: (...args: any) => void): this {
        this.ensureListenerCount(event, (maxListeners: number) => maxListeners - 1);

        return super.removeListener(event, listener);
    }

    private ensureListenerCount(event: string | symbol, count: (maxListeners: number) => number): void {
        const maxListeners: number = this.getMaxListeners();
        const listenerCount: number = this.listenerCount(event);

        if (listenerCount >= maxListeners) {
            this.setMaxListeners(count(maxListeners));
        }
    }
}
