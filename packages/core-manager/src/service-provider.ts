import { Providers} from "@arkecosystem/core-kernel";

export class ServiceProvider extends Providers.ServiceProvider {
    public async register(): Promise<void> {
        // TODO: Remove
        console.log("Registered")
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async boot(): Promise<void> {
        // TODO: Remove
        console.log("Booted")
    }

    public async dispose(): Promise<void> {
        // TODO: Remove
        console.log("Disposed")
    }

    public async required(): Promise<boolean> {
        return false;
    }
}
