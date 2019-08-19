// import logProcessErrors from "log-process-errors";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadErrorHandler
 */
export class LoadErrorHandler extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof LoadErrorHandler
     */
    public async bootstrap(): Promise<void> {
        // @TODO: implement passing in of options and ensure handling of critical exceptions
        // logProcessErrors({ exitOn: [] });
    }
}
