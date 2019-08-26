import logProcessErrors from "log-process-errors";
import { IBootstrapper } from "../interfaces";

/**
 * @export
 * @class RegisterErrorHandler
 * @implements {IBootstrapper}
 */
export class RegisterErrorHandler implements IBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof RegisterErrorHandler
     */
    public async bootstrap(): Promise<void> {
        // @todo: implement passing in of options and ensure handling of critical exceptions
        logProcessErrors({ exitOn: [] });
    }
}
