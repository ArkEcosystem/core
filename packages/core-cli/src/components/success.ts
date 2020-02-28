import { white } from "kleur";

import { Identifiers, inject, injectable } from "../ioc";
import { Logger } from "../services";

/**
 * @export
 * @class Success
 */
@injectable()
export class Success {
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
     * @memberof Success
     */
    public render(message: string): void {
        this.logger.info(white().bgGreen(`[OK] ${message}`));
    }
}
