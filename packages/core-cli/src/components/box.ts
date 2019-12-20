import boxen from "boxen";

import { Identifiers, inject, injectable } from "../ioc";
import { Logger } from "../services";

/**
 * @export
 * @class Box
 */
@injectable()
export class Box {
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
     * @memberof Box
     */
    public render(message: string): void {
        this.logger.log(boxen(message, { margin: 1, padding: 1, borderStyle: boxen.BorderStyle.Classic }));
    }
}
