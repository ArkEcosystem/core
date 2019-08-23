import mm from "micromatch";
import { IEventDispatcher } from "../../contracts/kernel/events";
import { EventListener, EventName } from "../../types/events";

/**
 * @export
 * @class EventDispatcher
 * @implements {IEventDispatcher}
 */
export class EventDispatcher implements IEventDispatcher {
    /**
     * @private
     * @type {Map<EventName, Set<EventListener>>}
     * @memberof EventDispatcher
     */
    private readonly listeners: Map<EventName, Set<EventListener>> = new Map<EventName, Set<EventListener>>();

    /**
     * @param {EventName} event
     * @param {EventListener} listener
     * @returns {() => void}
     * @memberof EventDispatcher
     */
    public listen(event: EventName, listener: EventListener): () => void {
        this.getListenersByEvent(event).add(listener);

        return this.forget.bind(this, event, listener);
    }

    /**
     * @param {Array<[EventName, EventListener]>} events
     * @returns {Map<EventName, () => void>}
     * @memberof EventDispatcher
     */
    public listenMany(events: Array<[EventName, EventListener]>): Map<EventName, () => void> {
        const listeners: Map<EventName, () => void> = new Map();

        for (const [event, listener] of events) {
            listeners.set(event, this.listen(event, listener));
        }

        return listeners;
    }

    /**
     * @param {EventName} name
     * @param {EventListener} listener
     * @memberof EventDispatcher
     */
    public listenOnce(name: EventName, listener: EventListener): void {
        const off: () => void = this.listen(name, (event, data) => {
            off();

            listener(event, data);
        });
    }

    /**
     * @param {EventName} event
     * @param {EventListener} listener
     * @memberof EventDispatcher
     */
    public forget(event: EventName, listener: EventListener): void {
        this.getListenersByEvent(event).delete(listener);
    }

    /**
     * @param {Array<[EventName, EventListener]>} events
     * @memberof EventDispatcher
     */
    public forgetMany(events: Array<[EventName, EventListener]>): void {
        for (const [event, listener] of events) {
            this.forget(event, listener);
        }
    }

    /**
     * @memberof EventDispatcher
     */
    public flush(): void {
        this.listeners.clear();
    }

    /**
     * @param {EventName} [event]
     * @returns {EventListener[]}
     * @memberof EventDispatcher
     */
    public getListeners(event?: EventName): EventListener[] {
        return Array.from(this.getListenersByEvent(event));
    }

    /**
     * @param {EventName} event
     * @returns {boolean}
     * @memberof EventDispatcher
     */
    public hasListeners(event: EventName): boolean {
        return this.getListenersByEvent(event).size > 0;
    }

    /**
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @returns {Promise<void>}
     * @memberof EventDispatcher
     */
    public async dispatch<T = any>(event: EventName, data?: T): Promise<void> {
        await Promise.resolve();

        const resolvers: Array<Promise<void>> = [];

        for (const [e, eventListeners] of this.getListenersByPattern(event).entries()) {
            for (const listener of eventListeners) {
                resolvers.push(new Promise(resolve => resolve(listener(e, data))));
            }
        }

        await Promise.all(resolvers);
    }

    /**
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @returns {Promise<void>}
     * @memberof EventDispatcher
     */
    public async dispatchSeq<T = any>(event: EventName, data?: T): Promise<void> {
        await Promise.resolve();

        for (const [e, eventListeners] of this.getListenersByPattern(event).entries()) {
            for (const listener of eventListeners) {
                // tslint:disable-next-line: await-promise
                await listener(e, data);
            }
        }
    }

    /**
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @memberof EventDispatcher
     */
    public dispatchSync<T = any>(event: EventName, data?: T): void {
        for (const [e, eventListeners] of this.getListenersByPattern(event).entries()) {
            for (const listener of eventListeners) {
                listener(e, data);
            }
        }
    }

    /**
     * @template T
     * @param {Array<[EventName, T]>} events
     * @returns {Promise<void>}
     * @memberof EventDispatcher
     */
    public async dispatchMany<T = any>(events: Array<[EventName, T]>): Promise<void> {
        await Promise.all(Object.values(events).map((value: [EventName, T]) => this.dispatch(value[0], value[1])));
    }

    /**
     * @template T
     * @param {Array<[EventName, T]>} events
     * @returns {Promise<void>}
     * @memberof EventDispatcher
     */
    public async dispatchManySeq<T = any>(events: Array<[EventName, T]>): Promise<void> {
        for (const value of Object.values(events)) {
            await this.dispatchSeq(value[0], value[1]);
        }
    }

    /**
     * @template T
     * @param {Array<[EventName, T]>} events
     * @memberof EventDispatcher
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
     * @memberof EventDispatcher
     */
    private getListenersByEvent(name: EventName): Set<EventListener> {
        if (!this.listeners.has(name)) {
            this.listeners.set(name, new Set());
        }

        return this.listeners.get(name);
    }

    /**
     * @private
     * @param {EventName} event
     * @returns {Map<EventName, EventListener[]>}
     * @memberof EventDispatcher
     */
    private getListenersByPattern(event: EventName): Map<EventName, EventListener[]> {
        // @ts-ignore
        const matches: EventName[] = mm([...this.listeners.keys()], event);

        const listeners: Map<EventName, EventListener[]> = new Map<EventName, EventListener[]>();
        for (const match of matches) {
            const eventListeners: Set<EventListener> = this.getListenersByEvent(match);

            if (eventListeners.size > 0) {
                listeners.set(match, Array.from(eventListeners));
            }
        }

        return listeners;
    }
}
