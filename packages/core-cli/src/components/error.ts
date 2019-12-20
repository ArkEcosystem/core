import { white } from "kleur";

import { Identifiers, inject, injectable } from "../ioc";
import { Logger } from "../services";

/**
 * @export
 * @class Error
 */
@injectable()
export class Error {
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
     * @memberof Error
     */
    public render(message: string): void {
        this.logger.error(white().bgRed(`[ERROR] ${message}`));
    }
}
