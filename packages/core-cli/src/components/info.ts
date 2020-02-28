import { white } from "kleur";

import { Identifiers, inject, injectable } from "../ioc";
import { Logger } from "../services";

/**
 * @export
 * @class Info
 */
@injectable()
export class Info {
    /**
     * @private
     * @type {Logger}
     * @memberof Command
     */
    @inject(Identifiers.Logger)
    private readonly logger!: Logger;

    /**
     * @static
     * @param {string} message
     * @memberof Info
     */
    public render(message: string): void {
        this.logger.info(white().bgBlue(`[INFO] ${message}`));
    }
}
