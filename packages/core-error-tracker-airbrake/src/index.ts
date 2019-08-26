import { Support } from "@arkecosystem/core-kernel";
import AirBrake from "airbrake-js";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.ioc.bind("errorTracker").toConstantValue(new AirBrake(this.config().all()));
    }
}
