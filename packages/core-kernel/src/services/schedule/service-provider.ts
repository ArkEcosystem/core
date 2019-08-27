import { AbstractServiceProvider } from "../../providers";
import { Schedule } from "./schedule";
import { Identifiers } from "../../container";

/**
 * @export
 * @class ServiceProvider
 * @extends {AbstractServiceProvider}
 */
export class ServiceProvider extends AbstractServiceProvider {
    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<Schedule>(Identifiers.ScheduleService)
            .to(Schedule)
            .inSingletonScope();
    }
}
