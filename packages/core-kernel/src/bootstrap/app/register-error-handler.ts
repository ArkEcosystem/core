// import logProcessErrors from "log-process-errors";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class RegisterErrorHandler
 */
export class RegisterErrorHandler extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof RegisterErrorHandler
     */
    public async bootstrap(): Promise<void> {
        // @TODO: implement passing in of options and ensure handling of critical exceptions
        // logProcessErrors({ exitOn: [] });
    }
}
