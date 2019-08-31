import { Identifiers, inject, injectable } from "../../container";
import { Application } from "../../contracts/kernel";
import { Watcher } from "../../services/config/watcher";
import { Bootstrapper } from "../interfaces";

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
        await this.app.resolve<Watcher>(Watcher).start();
    }
}
