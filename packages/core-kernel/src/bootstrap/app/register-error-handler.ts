import logProcessErrors from "log-process-errors";
import { Bootstrapper } from "../interfaces";

/**
 * @export
 * @class RegisterErrorHandler
 * @implements {Bootstrapper}
 */
export class RegisterErrorHandler implements Bootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof RegisterErrorHandler
     */
    public async bootstrap(): Promise<void> {
        // @todo: implement passing in of options and ensure handling of critical exceptions
        logProcessErrors({ exitOn: [] });
    }
}
