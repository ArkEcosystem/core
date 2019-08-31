import logProcessErrors from "log-process-errors";
import { Bootstrapper } from "../interfaces";
import { injectable } from "../../container";

/**
 * @export
 * @class RegisterErrorHandler
 * @implements {Bootstrapper}
 */
@injectable()
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
