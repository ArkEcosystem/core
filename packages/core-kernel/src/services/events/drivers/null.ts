import { EventDispatcher as EventDispatcherContract, EventListener, EventName } from "../../../contracts/kernel/events";
import { injectable } from "../../../ioc";

/**
 * @export
 * @class MemoryEventDispatcher
 * @implements {EventDispatcherContract}
 */
@injectable()
export class NullEventDispatcher implements EventDispatcherContract {
    /**
     * @param {EventName} event
     * @param {EventListener} listener
     * @returns {() => void}
     * @memberof MemoryEventDispatcher
     */
    public listen(event: EventName, listener: EventListener): () => void {
        return () => {};
    }

    /**
     * @param {Array<[EventName, EventListener]>} events
     * @returns {Map<EventName, () => void>}
     * @memberof MemoryEventDispatcher
     */
    public listenMany(events: Array<[EventName, EventListener]>): Map<EventName, () => void> {
        const map: Map<EventName, () => void> = new Map<EventName, () => void>();
        for (const [name] of events) {
            map.set(name, () => {});
        }
        return map;
    }

    /**
     * @param {EventName} name
     * @param {EventListener} listener
     * @memberof MemoryEventDispatcher
     */
    public listenOnce(name: EventName, listener: EventListener): void {
        //
    }

    /**
     * @param {EventName} event
     * @param {EventListener} [listener]
     * @memberof MemoryEventDispatcher
     */
    public forget(event: EventName, listener?: EventListener): void {}

    /**
     * @param {Array<[EventName, EventListener]>} events
     * @memberof MemoryEventDispatcher
     */
    public forgetMany(events: EventName[] | Array<[EventName, EventListener]>): void {
        //
    }

    /**
     * @memberof MemoryEventDispatcher
     */
    public flush(): void {
        //
    }

    /**
     * @param {EventName} [event]
     * @returns {EventListener[]}
     * @memberof MemoryEventDispatcher
     */
    public getListeners(event?: EventName): EventListener[] {
        return [];
    }

    /**
     * @param {EventName} event
     * @returns {boolean}
     * @memberof MemoryEventDispatcher
     */
    public hasListeners(event: EventName): boolean {
        return false;
    }

    /**
     * @param {EventName} event
     * @returns {number}
     * @memberof MemoryEventDispatcher
     */
    public countListeners(event?: EventName): number {
        return 0;
    }

    /**
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @returns {Promise<void>}
     * @memberof MemoryEventDispatcher
     */
    public async dispatch<T = any>(event: EventName, data?: T): Promise<void> {
        //
    }

    /**
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @returns {Promise<void>}
     * @memberof MemoryEventDispatcher
     */
    public async dispatchSeq<T = any>(event: EventName, data?: T): Promise<void> {
        //
    }

    /**
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @memberof MemoryEventDispatcher
     */
    public dispatchSync<T = any>(event: EventName, data?: T): void {
        //
    }

    /**
     * @template T
     * @param {Array<[EventName, T]>} events
     * @returns {Promise<void>}
     * @memberof MemoryEventDispatcher
     */
    public async dispatchMany<T = any>(events: Array<[EventName, T]>): Promise<void> {
        //
    }

    /**
     * @template T
     * @param {Array<[EventName, T]>} events
     * @returns {Promise<void>}
     * @memberof MemoryEventDispatcher
     */
    public async dispatchManySeq<T = any>(events: Array<[EventName, T]>): Promise<void> {
        //
    }

    /**
     * @template T
     * @param {Array<[EventName, T]>} events
     * @memberof MemoryEventDispatcher
     */
    public dispatchManySync<T = any>(events: Array<[EventName, T]>): void {
        //
    }
}
