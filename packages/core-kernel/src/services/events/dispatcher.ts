import EventEmitter from "eventemitter3";
import { IEventDispatcher } from "../../contracts/core-kernel/event-dispatcher";

/**
 * @export
 * @class EventDispatcher
 * @implements {IEventDispatcher}
 */
export class EventDispatcher implements IEventDispatcher {
    /**
     * @private
     * @type {EventEmitter}
     * @memberof EventDispatcher
     */
    private readonly dispatcher: EventEmitter = new EventEmitter();

    /**
     * @param {(string | string[])} eventNames
     * @param {*} listener
     * @memberof EventDispatcher
     */
    public listen(eventNames: string | string[], listener: any): void {
        if (!Array.isArray(eventNames)) {
            eventNames = [eventNames];
        }

        for (const eventName of Object.values(eventNames)) {
            this.dispatcher.addListener(eventName, listener);
        }
    }

    /**
     * @param {(string | string[])} eventNames
     * @param {*} listener
     * @memberof EventDispatcher
     */
    public dispatch(eventNames: string | string[], listener: any): void {
        if (!Array.isArray(eventNames)) {
            eventNames = [eventNames];
        }

        for (const eventName of Object.values(eventNames)) {
            this.dispatcher.emit(eventName, listener);
        }
    }

    /**
     * @param {(string | string[])} eventNames
     * @memberof EventDispatcher
     */
    public forget(eventNames: string | string[]): void {
        if (!Array.isArray(eventNames)) {
            eventNames = [eventNames];
        }

        for (const eventName of Object.values(eventNames)) {
            this.dispatcher.removeListener(eventName);
        }
    }

    /**
     * @param {string} eventName
     * @returns {boolean}
     * @memberof EventDispatcher
     */
    public has(eventName: string): boolean {
        return this.dispatcher.eventNames().includes(eventName);
    }

    /**
     * @param {string} eventName
     * @returns {any[]}
     * @memberof EventDispatcher
     */
    public getListeners(eventName: string): any[] {
        return this.dispatcher.listeners(eventName);
    }

    /**
     * @returns {number}
     * @memberof EventDispatcher
     */
    public count(): number {
        return this.dispatcher.eventNames().length;
    }
}
