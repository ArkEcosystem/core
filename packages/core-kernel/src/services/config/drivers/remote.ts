import { IApplication } from "../../../contracts/kernel";
import { IConfigLoader } from "../../../contracts/kernel/config";
import { inject } from "../../../container";

/**
 * @export
 * @class Remote
 * @implements {IConfigLoader}
 */
export class Remote implements IConfigLoader {
    /**
     * The application instance.
     *
     * @protected
     * @type {IApplication}
     * @memberof Manager
     */
    protected readonly app: IApplication;

    /**
     * Create a new manager instance.
     *
     * @param {{ app:IApplication }} { app }
     * @memberof Manager
     */
    public constructor(@inject("app") app: IApplication) {
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
