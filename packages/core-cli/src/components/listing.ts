import { Identifiers, inject, injectable } from "../ioc";
import { Logger } from "../services";

/**
 * @export
 * @class Listing
 */
@injectable()
export class Listing {
    /**
     * @private
     * @type {Logger}
     * @memberof Command
     */
    @inject(Identifiers.Logger)
    private readonly logger!: Logger;

    /**
     * @static
     * @param {string[]} elements
     * @returns {Promise<void>}
     * @memberof Listing
     */
    public async render(elements: string[]): Promise<void> {
        for (const element of elements) {
            this.logger.log(` * ${element}`);
        }
    }
}
