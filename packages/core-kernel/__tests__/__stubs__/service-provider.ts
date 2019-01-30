import { AbstractServiceProvider } from "../../src";

export class ServiceProvider extends AbstractServiceProvider {
    /**
     * Register any application services.
     */
    public async register(): Promise<void> {
        this.app.bind(this.getName(), true);
    }

    /**
     * Dispose any application services.
     */
    public async dispose(): Promise<void> {
        this.app.bind(this.getName(), false);
    }

    public getManifest(): Record<string, any> {
        return {
            name: "api",
            version: "1.0.0",
        };
    }
}
