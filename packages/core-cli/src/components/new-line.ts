import { Identifiers, inject, injectable } from "../ioc";
import { Logger } from "../services";

/**
 * @export
 * @class NewLine
 */
@injectable()
export class NewLine {
    /**
     * @private
     * @type {Logger}
     * @memberof Command
     */
    @inject(Identifiers.Logger)
    private readonly logger!: Logger;

    /**
     * @static
     * @param {number} [count=1]
     * @memberof NewLine
     */
    public render(count: number = 1): void {
        this.logger.log("\n".repeat(count));
    }
}
