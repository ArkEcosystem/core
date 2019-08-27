import mm from "micromatch";
import { EventDispatcher as EventDispatcherContract } from "../../contracts/kernel/events";
import { EventListener, EventName } from "../../types/events";
import { injectable } from "../../container";

/**
 * @export
 * @class EventDispatcher
 * @implements {EventDispatcher}
 */
@injectable()
export class EventDispatcher implements EventDispatcherContract {
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
        const listeners: Map<EventName, () => void> = new Map<EventName, () => void>();

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
        const off: () => void = this.listen(name, data => {
            off();

            listener(data);
        });
    }

    /**
     * @param {EventName} event
     * @param {EventListener} [listener]
     * @memberof EventDispatcher
     */
    public forget(event: EventName, listener?: EventListener): void {
        listener ? this.getListenersByEvent(event).delete(listener) : this.listeners.delete(event);
    }

    /**
     * @param {Array<[EventName, EventListener]>} events
     * @memberof EventDispatcher
     */
    public forgetMany(events: EventName[] | Array<[EventName, EventListener]>): void {
        for (const event of events) {
            Array.isArray(event) ? this.forget(event[0], event[1]) : this.forget(event);
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
        return [...this.getListenersByPattern(event).values()];
    }

    /**
     * @param {EventName} event
     * @returns {boolean}
     * @memberof EventDispatcher
     */
    public hasListeners(event: EventName): boolean {
        return this.getListenersByPattern(event).length > 0;
    }

    /**
     * @param {EventName} event
     * @returns {number}
     * @memberof EventDispatcher
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
     * @memberof EventDispatcher
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
     * @memberof EventDispatcher
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
     * @memberof EventDispatcher
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
            this.listeners.set(name, new Set<EventListener>());
        }

        return this.listeners.get(name);
    }

    /**
     * @private
     * @param {EventName} event
     * @returns {EventListener[]}
     * @memberof EventDispatcher
     */
    private getListenersByPattern(event: EventName): EventListener[] {
        // @ts-ignore
        const matches: EventName[] = mm([...this.listeners.keys()], event);

        let eventListeners: EventListener[] = [];
        if (this.listeners.has("*")) {
            eventListeners = eventListeners.concat(Array.from(this.getListenersByEvent("*")));
        }

        for (const match of matches) {
            const matchListeners: Set<EventListener> = this.getListenersByEvent(match);

            if (matchListeners.size > 0) {
                eventListeners = eventListeners.concat(Array.from(matchListeners));
            }
        }

        return eventListeners;
    }
}
