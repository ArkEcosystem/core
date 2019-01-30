import { parseFileSync } from "envfile";

export class LoadEnvironmentVariables {
    /**
     * Bootstrap the given application.
     */
    public bootstrap(app): void {
        try {
            const config = parseFileSync(app.environmentFile());

            for (const [key, value] of Object.entries(config)) {
                // @ts-ignore
                process.env[key] = value;
            }
        } catch (error) {
            throw new Error("Unable to load the environment file.");
        }
    }
}
