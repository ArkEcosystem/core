import { Kernel } from "../contracts";

/**
 * @export
 * @abstract
 * @class AbstractBootstrapper
 */
export abstract class AbstractBootstrapper {
    /**
     * The application instance.
     *
     * @protected
     * @type {IApplication}
     * @memberof AbstractManager
     */
    protected readonly app: Kernel.IApplication;

    /**
     * Creates an instance of AbstractBootstrapper.
     *
     * @param {{ app: Kernel.IApplication }} { app }
     * @memberof AbstractBootstrapper
     */
    public constructor({ app }: { app: Kernel.IApplication }) {
        this.app = app;
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     * @memberof AbstractBootstrapper
     */
    public abstract async bootstrap(): Promise<void>;
}
