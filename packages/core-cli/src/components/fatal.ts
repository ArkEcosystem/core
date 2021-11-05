import { white } from "kleur";

import { Runtime } from "../exceptions";
import { Identifiers, inject, injectable } from "../ioc";
import { Logger } from "../services";

/**
 * @export
 * @class Fatal
 */
@injectable()
export class Fatal {
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
     * @memberof Fatal
     */
    public render(message: string): void {
        this.logger.error(white().bgRed(`[ERROR] ${message}`));

        throw new Runtime.FatalException(message);
    }
}
