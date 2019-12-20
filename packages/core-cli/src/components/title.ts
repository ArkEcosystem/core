import { yellow } from "kleur";

import { Identifiers, inject, injectable } from "../ioc";
import { Logger } from "../services";

/**
 * @export
 * @class Title
 */
@injectable()
export class Title {
    /**
     * @private
     * @type {Logger}
     * @memberof Command
     */
    @inject(Identifiers.Logger)
    private readonly logger!: Logger;

    /**
     * @param {string} title
     * @returns {Promise<void>}
     * @memberof Title
     */
    public async render(title: string): Promise<void> {
        this.logger.log(yellow(title));
        this.logger.log(yellow("=".repeat(title.length)));
    }
}
