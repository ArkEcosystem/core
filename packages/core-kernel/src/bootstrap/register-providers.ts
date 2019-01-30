import semver from "semver";

export class RegisterProviders {
    /**
     * Register all of the configured providers.
     */
    public bootstrap(app): void {
        const providers = app.config.get("providers");

        for (const [pkg, opts] of Object.entries(providers)) {
            const { ServiceProvider } = require(pkg);

            const serviceProvider = new ServiceProvider(app, opts);

            if (this.satisfiesDependencies(app, serviceProvider)) {
                serviceProvider.register();
            }
        }
    }

    /**
     * Check if all of the required dependencies are registered.
     */
    private satisfiesDependencies(app, serviceProvider): boolean {
        const dependencies = serviceProvider.depends();

        if (!dependencies) {
            return true;
        }

        for (const [dep, version] of Object.entries(dependencies)) {
            if (!app.has(dep)) {
                throw new Error("dep doesn't exist");
            }

            // @ts-ignore
            if (semver.satisfies(app.resolve(dep).getVersion(), version)) {
                throw new Error(" dep has wrong min version");
            }
        }

        return true;
    }
}
