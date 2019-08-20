import { Kernel } from "../../../contracts";

/**
 * @export
 * @class Remote
 * @implements {Kernel.IConfigAdapter}
 */
export class Remote implements Kernel.IConfigAdapter {
    /**
     * The application instance.
     *
     * @protected
     * @type {Kernel.IApplication}
     * @memberof Manager
     */
    protected readonly app: Kernel.IApplication;

    /**
     * Create a new manager instance.
     *
     * @param {{ app:Kernel.IApplication }} { app }
     * @memberof Manager
     */
    public constructor({ app }: { app: Kernel.IApplication }) {
        this.app = app;
    }

    /**
     * @returns {Promise<void>}
     * @memberof Remote
     */
    public async loadConfiguration(): Promise<void> {
        // @TODO
    }

    /**
     * @returns {Promise<void>}
     * @memberof Remote
     */
    public async loadEnvironmentVariables(): Promise<void> {
        // @TODO
    }
}
