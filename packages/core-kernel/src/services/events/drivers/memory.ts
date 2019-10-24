import { assert } from "@packages/core-kernel/src/utils";
import mm from "micromatch";

import { EventDispatcher as EventDispatcherContract } from "../../../contracts/kernel/events";
import { injectable } from "../../../ioc";
import { EventListener, EventName } from "../../../types/events";

/**
 * @export
 * @class MemoryEventDispatcher
 * @implements {EventDispatcherContract}
 */
@injectable()
export class MemoryEventDispatcher implements EventDispatcherContract {
    /**
     * @private
     * @type {Map<EventName, Set<EventListener>>}
     * @memberof MemoryEventDispatcher
     */
    private readonly listeners: Map<EventName, Set<EventListener>> = new Map<EventName, Set<EventListener>>();

    /**
     * @param {EventName} event
     * @param {EventListener} listener
     * @returns {() => void}
     * @memberof MemoryEventDispatcher
     */
    public listen(event: EventName, listener: EventListener): () => void {
        this.getListenersByEvent(event).add(listener);

        return this.forget.bind(this, event, listener);
    }

    /**
     * @param {Array<[EventName, EventListener]>} events
     * @returns {Map<EventName, () => void>}
     * @memberof MemoryEventDispatcher
     */
    public listenMany(events: Array<[EventName, EventListener]>): Map<EventName, () => void> {
        const listeners: Map<EventName, () => void> = new Map<EventName, () => void>();

        for (const [event, listener] of events) {
            listeners.set(event, this.listen(event, listener));
        }

        return listeners;
    }

    /**
     * @param {EventName} name
     * @param {EventListener} listener
     * @memberof MemoryEventDispatcher
     */
    public listenOnce(name: EventName, listener: EventListener): void {
        const off: () => void = this.listen(name, data => {
            off();

            listener(data);
        });
    }

    /**
     * @param {EventName} event
     * @param {EventListener} [listener]
     * @memberof MemoryEventDispatcher
     */
    public forget(event: EventName, listener?: EventListener): boolean {
        if (event && listener) {
            return this.getListenersByEvent(event).delete(listener);
        }

        return this.listeners.delete(event);
    }

    /**
     * @param {Array<[EventName, EventListener]>} events
     * @memberof MemoryEventDispatcher
     */
    public forgetMany(events: EventName[] | Array<[EventName, EventListener]>): void {
        for (const event of events) {
            Array.isArray(event) ? this.forget(event[0], event[1]) : this.forget(event);
        }
    }

    /**
     * @memberof MemoryEventDispatcher
     */
    public flush(): void {
        this.listeners.clear();
    }

    /**
     * @param {EventName} [event]
     * @returns {EventListener[]}
     * @memberof MemoryEventDispatcher
     */
    public getListeners(event?: EventName): EventListener[] {
        return [...this.getListenersByPattern(event || "*").values()];
    }

    /**
     * @param {EventName} event
     * @returns {boolean}
     * @memberof MemoryEventDispatcher
     */
    public hasListeners(event: EventName): boolean {
        return this.getListenersByPattern(event).length > 0;
    }

    /**
     * @param {EventName} event
     * @returns {number}
     * @memberof MemoryEventDispatcher
     */
    public countListeners(event?: EventName): number {
        if (event) {
            return this.getListenersByPattern(event).length;
        }

        let totalCount = 0;
        for (const values of this.listeners.values()) {
            totalCount += values.size;
        }

        return totalCount;
    }

    /**
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @returns {Promise<void>}
     * @memberof MemoryEventDispatcher
     */
    public async dispatch<T = any>(event: EventName, data?: T): Promise<void> {
        await Promise.resolve();

        const resolvers: Array<Promise<void>> = [];

        for (const listener of this.getListenersByPattern(event)) {
            resolvers.push(new Promise(resolve => resolve(listener({ name: event, data }))));
        }

        await Promise.all(resolvers);
    }

    /**
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @returns {Promise<void>}
     * @memberof MemoryEventDispatcher
     */
    public async dispatchSeq<T = any>(event: EventName, data?: T): Promise<void> {
        await Promise.resolve();

        for (const listener of this.getListenersByPattern(event)) {
            await listener({
                name: event,
                data,
            });
        }
    }

    /**
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @memberof MemoryEventDispatcher
     */
    public dispatchSync<T = any>(event: EventName, data?: T): void {
        for (const listener of this.getListenersByPattern(event)) {
            listener({
                name: event,
                data,
            });
        }
    }

    /**
     * @template T
     * @param {Array<[EventName, T]>} events
     * @returns {Promise<void>}
     * @memberof MemoryEventDispatcher
     */
    public async dispatchMany<T = any>(events: Array<[EventName, T]>): Promise<void> {
        await Promise.all(Object.values(events).map((value: [EventName, T]) => this.dispatch(value[0], value[1])));
    }

    /**
     * @template T
     * @param {Array<[EventName, T]>} events
     * @returns {Promise<void>}
     * @memberof MemoryEventDispatcher
     */
    public async dispatchManySeq<T = any>(events: Array<[EventName, T]>): Promise<void> {
        for (const value of Object.values(events)) {
            await this.dispatchSeq(value[0], value[1]);
        }
    }

    /**
     * @template T
     * @param {Array<[EventName, T]>} events
     * @memberof MemoryEventDispatcher
     */
    public dispatchManySync<T = any>(events: Array<[EventName, T]>): void {
        for (const value of Object.values(events)) {
            this.dispatchSync(value[0], value[1]);
        }
    }

    /**
     * @private
     * @param {EventName} name
     * @returns {Set<EventListener>}
     * @memberof MemoryEventDispatcher
     */
    private getListenersByEvent(name: EventName): Set<EventListener> {
        if (!this.listeners.has(name)) {
            this.listeners.set(name, new Set<EventListener>());
        }

        return assert.defined(this.listeners.get(name));
    }

    /**
     * @private
     * @param {EventName} event
     * @returns {EventListener[]}
     * @memberof MemoryEventDispatcher
     */
    private getListenersByPattern(event: EventName): EventListener[] {
        // @ts-ignore
        const matches: EventName[] = mm([...this.listeners.keys()], event);

        let eventListeners: EventListener[] = [];
        if (this.listeners.has("*")) {
            eventListeners = eventListeners.concat(Array.from(this.getListenersByEvent("*") || []));
        }

        for (const match of matches) {
            const matchListeners: Set<EventListener> | undefined = this.getListenersByEvent(match);

            if (matchListeners && matchListeners.size > 0) {
                eventListeners = eventListeners.concat(Array.from(matchListeners));
            }
        }

        return eventListeners;
    }
}
