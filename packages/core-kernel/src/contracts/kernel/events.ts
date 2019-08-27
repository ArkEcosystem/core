import { EventListener, EventName } from "../../types/events";

/**
 * @export
 * @interface EventDispatcher
 */
export interface EventDispatcher {
    /**
     * Register a listener with the dispatcher.
     *
     * @param {EventName} event
     * @param {EventListener} listener
     * @returns {() => void}
     * @memberof EventDispatcher
     */
    listen(event: EventName, listener: EventListener): () => void;

    /**
     * Register many listeners with the dispatcher.
     *
     * @param {Array<[EventName, EventListener]>} events
     * @returns {Map<EventName, () => void>}
     * @memberof EventDispatcher
     */
    listenMany(events: Array<[EventName, EventListener]>): Map<EventName, () => void>;

    /**
     * Register a one-time listener with the dispatcher.
     *
     * @param {EventName} name
     * @param {EventListener} listener
     * @memberof EventDispatcher
     */
    listenOnce(name: EventName, listener: EventListener): void;

    /**
     * Remove a listener from the dispatcher.
     *
     * @param {EventName} event
     * @param {EventListener} [listener]
     * @memberof EventDispatcher
     */
    forget(event: EventName, listener?: EventListener): void;

    /**
     * Remove many listeners from the dispatcher.
     *
     * @param {Array<[EventName, EventListener]>} events
     * @memberof EventDispatcher
     */
    forgetMany(events: Array<[EventName, EventListener]>): void;

    /**
     * Remove all listeners from the dispatcher.
     *
     * @memberof EventDispatcher
     */
    flush(): void;

    /**
     * Get all of the listeners for a given event name.
     *
     * @param {EventName} event
     * @returns {EventListener[]}
     * @memberof EventDispatcher
     */
    getListeners(event: EventName): EventListener[];

    /**
     * Determine if a given event has listeners.
     *
     * @param {EventName} event
     * @returns {boolean}
     * @memberof EventDispatcher
     */
    hasListeners(event: EventName): boolean;

    /**
     * Fire an event and call the listeners in asynchronous order.
     *
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @returns {Promise<void>}
     * @memberof EventDispatcher
     */
    dispatch<T = any>(event: EventName, data?: T): Promise<void>;

    /**
     * Fire an event and call the listeners in sequential order.
     *
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @returns {Promise<void>}
     * @memberof EventDispatcher
     */
    dispatchSeq<T = any>(event: EventName, data?: T): Promise<void>;

    /**
     * Fire an event and call the listeners in synchronous order.
     *
     * @template T
     * @param {EventName} event
     * @param {T} [data]
     * @memberof EventDispatcher
     */
    dispatchSync<T = any>(event: EventName, data?: T): void;

    /**
     * Fire many events and call the listeners in asynchronous order.
     *
     * @template T
     * @param {Array<[EventName, T]>} events
     * @returns {Promise<void>}
     * @memberof EventDispatcher
     */
    dispatchMany<T = any>(events: Array<[EventName, T]>): Promise<void>;

    /**
     * Fire many events and call the listeners in sequential order.
     *
     * @template T
     * @param {Array<[EventName, T]>} events
     * @returns {Promise<void>}
     * @memberof EventDispatcher
     */
    dispatchManySeq<T = any>(events: Array<[EventName, T]>): Promise<void>;

    /**
     * Fire many events and call the listeners in synchronous order.
     *
     * @template T
     * @param {Array<[EventName, T]>} events
     * @memberof EventDispatcher
     */
    dispatchManySync<T = any>(events: Array<[EventName, T]>): void;
}
