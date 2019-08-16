import { Kernel } from "../../contracts";

/**
 * @export
 * @class QueueFactory
 */
export class QueueFactory {
    /**
     * @param {Kernel.IApplication} app
     * @memberof QueueFactory
     */
    // @ts-ignore
    public constructor(private readonly app: Kernel.IApplication) {}
}
