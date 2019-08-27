import { Application } from "../../contracts/kernel";
import { Bootstrapper } from "../interfaces";
import { injectable, inject, Identifiers } from "../../container";
import { Watcher } from "../../services/config/watcher";

/**
 * @export
 * @class WatchConfiguration
 * @implements {Bootstrapper}
 */
@injectable()
export class WatchConfiguration implements Bootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {Application}
     * @memberof WatchConfiguration
     */
    @inject(Identifiers.Application)
    private readonly app: Application;

    /**
     * @returns {Promise<void>}
     * @memberof WatchConfiguration
     */
    public async bootstrap(): Promise<void> {
        this.app.resolve<Watcher>(Watcher).watch();
    }
}
