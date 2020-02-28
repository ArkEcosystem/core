import { white } from "kleur";

import { Identifiers, inject, injectable } from "../ioc";
import { Logger } from "../services";

/**
 * @export
 * @class Warning
 */
@injectable()
export class Warning {
    /**
     * @private
     * @type {Logger}
     * @memberof Warning
     */
    @inject(Identifiers.Logger)
    private readonly logger!: Logger;

    /**
     * @static
     * @param {string} message
     * @memberof Warning
     */
    public render(message: string): void {
        this.logger.warning(white().bgYellow(`[WARNING] ${message}`));
    }
}
