import { Support } from "@arkecosystem/core-kernel";
import AirBrake from "airbrake-js";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        this.app.bind("errorTracker", new AirBrake(this.config().all()));
    }

    public provides(): string[] {
        return ["errorTracker"];
    }
}
