export interface IEventDispatcher {
    /**
     * Register an event listener with the dispatcher.
     */
    listen(eventNames: string | string[], listener: any): void;

    /**
     * Fire an event and call the listeners.
     */
    dispatch(eventNames: string | string[], listener: any): void;

    /**
     * Remove a set of listeners from the dispatcher.
     */
    forget(eventNames: string | string[]): void;

    /**
     * Determine if a given event has listeners.
     */
    has(eventName: string): boolean;

    /**
     * Get all of the listeners for a given event name.
     */
    getListeners(eventName: string): any;

    /**
     * Get the number of registered events.
     */
    count(): number;
}
