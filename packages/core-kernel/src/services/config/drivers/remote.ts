import { Application } from "../../../contracts/kernel";
import { ConfigLoader } from "../../../contracts/kernel/config";
import { inject } from "../../../container";

/**
 * @export
 * @class Remote
 * @implements {ConfigLoader}
 */
export class Remote implements ConfigLoader {
    /**
     * The application instance.
     *
     * @protected
     * @type {Application}
     * @memberof Manager
     */
    protected readonly app: Application;

    /**
     * Create a new manager instance.
     *
     * @param {{ app:Application }} { app }
     * @memberof Manager
     */
    public constructor(@inject("app") app: Application) {
        this.app = app;
    }

    /**
     * @returns {Promise<void>}
     * @memberof Remote
     */
    public async loadConfiguration(): Promise<void> {
        // @todo
    }

    /**
     * @returns {Promise<void>}
     * @memberof Remote
     */
    public async loadEnvironmentVariables(): Promise<void> {
        // @todo
    }
}
