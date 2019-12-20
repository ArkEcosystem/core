import { white } from "kleur";

import { injectable } from "../ioc";

/**
 * @export
 * @class Fatal
 */
@injectable()
export class Fatal {
    /**
     * @static
     * @param {string} message
     * @memberof Fatal
     */
    public render(message: string): void {
        throw new Error(white().bgRed(`[ERROR] ${message}`));
    }
}
