import { EventDispatcher } from "../../contracts/kernel/events";
import { InstanceManager } from "../../support/instance-manager";
import { MemoryEventDispatcher } from "./drivers/memory";

/**
 * @export
 * @class EventDispatcherManager
 * @extends {Manager<EventDispatcher>}
 */
export class EventDispatcherManager extends InstanceManager<EventDispatcher> {
    /**
     * Create an instance of the Memory driver.
     *
     * @protected
     * @returns {Promise<EventDispatcher>}
     * @memberof EventDispatcherManager
     */
    protected async createMemoryDriver(): Promise<EventDispatcher> {
        return this.app.resolve<EventDispatcher>(MemoryEventDispatcher);
    }

    /**
     * Get the default log driver name.
     *
     * @protected
     * @returns {string}
     * @memberof EventDispatcherManager
     */
    protected getDefaultDriver(): string {
        return "memory";
    }
}
