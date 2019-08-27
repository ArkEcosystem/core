import { ServiceProvider as BaseServiceProvider } from "../../providers";
import { Schedule } from "./schedule";
import { Identifiers } from "../../container";

/**
 * @export
 * @class ServiceProvider
 * @extends {ServiceProvider}
 */
export class ServiceProvider extends BaseServiceProvider {
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
