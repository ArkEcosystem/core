import { Services, Support } from "@arkecosystem/core-kernel";
import { SignaleLogger } from "./driver";

export class ServiceProvider extends Support.AbstractServiceProvider {
    public async register(): Promise<void> {
        const logManager: Services.Log.LogManager = this.app.resolve<Services.Log.LogManager>("logManager");
        await logManager.extend("signale", async () => new SignaleLogger(this.config()).make());
        logManager.setDefaultDriver("signale");

        // Note: Ensure that we rebind the logger that is bound to the container so IoC can do it's job.
        this.app.bind("log", logManager.driver());
    }

    public provides(): string[] {
        return ["log"];
    }

    public async required(): Promise<boolean> {
        return true;
    }
}
