import { IApplication } from "../../contracts/kernel";
import { IBootstrapper } from "../interfaces";
import { injectable, inject } from "../../container";
import { Watcher } from "../../services/config/watcher";

/**
 * @export
 * @class WatchConfiguration
 * @implements {IBootstrapper}
 */
@injectable()
export class WatchConfiguration implements IBootstrapper {
    /**
     * The application instance.
     *
     * @private
     * @type {IApplication}
     * @memberof WatchConfiguration
     */
    @inject("app")
    private readonly app: IApplication;

    /**
     * @returns {Promise<void>}
     * @memberof WatchConfiguration
     */
    public async bootstrap(): Promise<void> {
        this.app.ioc.resolve<Watcher>(Watcher).watch();
    }
}
