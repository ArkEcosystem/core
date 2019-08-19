import { Kernel } from "../contracts";

/**
 * @export
 * @abstract
 * @class AbstractBootstrapper
 */
export abstract class AbstractBootstrapper {
    /**
     * Creates an instance of AbstractBootstrapper.
     *
     * @param {Kernel.IApplication} app
     * @memberof AbstractBootstrapper
     */
    public constructor(protected readonly app: Kernel.IApplication) {}
}
