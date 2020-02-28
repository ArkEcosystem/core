import ora, { Options, Ora } from "ora";

import { injectable } from "../ioc";

/**
 * @export
 * @class Spinner
 */
@injectable()
export class Spinner {
    /**
     * @static
     * @param {(string | Options | undefined)} [options]
     * @returns {Ora}
     * @memberof Spinner
     */
    public render(options?: string | Options | undefined): Ora {
        return ora(options);
    }
}
