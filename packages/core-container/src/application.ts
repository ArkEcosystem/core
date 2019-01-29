import { existsSync, writeFileSync } from "fs";
import { removeSync } from "fs-extra";
import camelCase from "lodash/camelCase";
import semver from "semver";
import { Container } from "./container";
import { DirectoryNotFound, InvalidVersion } from "./errors";

export class Application extends Container {
    /**
     * Indicates if the application has been bootstrapped.
     */
    private bootstrapped: boolean = false;

    /**
     * The application namespace.
     */
    private namespace: string;

    /**
     * Boot the application.
     */
    public bootstrapWith(config: Record<string, any>): void {
        this.bindEnvironment(config);

        this.bindNamespace();

        this.bindPathsInContainer(config.paths);

        this.bootstrapped = true;
    }

    /**
     * Get the version number of the application.
     */
    public version(): string {
        return this.resolve("app.version");
    }

    /**
     * Get the current application token.
     */
    public token(): string {
        return this.resolve("app.token");
    }

    /**
     * Get the current application network.
     */
    public network(): string {
        return this.resolve("app.network");
    }

    /**
     * Set the current application network.
     */
    public useNetwork(value: string): void {
        this.bind("app.network", value);
    }

    /**
     * Get the path to the data directory.
     */
    public dataPath(path: string = ""): string {
        return this.getPath("data").concat(path);
    }

    /**
     * Set the data directory.
     */
    public useDataPath(path: string): void {
        this.usePath("data", path);
    }

    /**
     * Get the path to the config directory.
     */
    public configPath(path: string = ""): string {
        return this.getPath("config").concat(path);
    }

    /**
     * Set the config directory.
     */
    public useConfigPath(path: string): void {
        this.usePath("config", path);
    }

    /**
     * Get the path to the cache directory.
     */
    public cachePath(path: string = ""): string {
        return this.getPath("cache").concat(path);
    }

    /**
     * Set the cache directory.
     */
    public useCachePath(path: string): void {
        this.usePath("cache", path);
    }

    /**
     * Get the path to the log directory.
     */
    public logPath(path: string = ""): string {
        return this.getPath("log").concat(path);
    }

    /**
     * Set the log directory.
     */
    public useLogPath(path: string): void {
        this.usePath("log", path);
    }

    /**
     * Get the path to the temp directory.
     */
    public tempPath(path: string = ""): string {
        return this.getPath("temp").concat(path);
    }

    /**
     * Set the temp directory.
     */
    public useTempPath(path: string): void {
        this.usePath("temp", path);
    }

    /**
     * Get the environment file the application is using.
     */
    public environmentFile(): string {
        return this.configPath(".env");
    }

    /**
     * Get the current application environment.
     */
    public environment(): string {
        return this.resolve("app.env");
    }

    /**
     * Set the current application environment.
     */
    public useEnvironment(value: string): void {
        this.bind("app.env", value);
    }

    /**
     * Determine if application is in local environment.
     */
    public isProduction(): boolean {
        return this.environment() === "production" || this.network() === "mainnet";
    }

    /**
     * Determine if application is in local environment.
     */
    public isDevelopment(): boolean {
        return this.environment() === "development" || ["devnet", "testnet"].includes(this.network());
    }

    /**
     * Determine if the application is running tests.
     */
    public runningTests(): boolean {
        return this.environment() === "test" || this.network() === "testnet";
    }

    /**
     * Determine if the application has been bootstrapped.
     */
    public isBootstrapped() {
        return this.bootstrapped;
    }

    /**
     * Determine if the application configuration is cached.
     */
    public configurationIsCached(): boolean {
        return existsSync(this.getCachedConfigPath());
    }

    /**
     * Get the path to the configuration cache file.
     */
    public getCachedConfigPath(): string {
        return this.cachePath("config");
    }

    /**
     * Put the application into maintenance mode.
     */
    public enableMaintenance(): void {
        writeFileSync(this.tempPath("maintenance"), JSON.stringify({ time: +new Date() }));

        // this.logger.warning("Application is now in maintenance mode.");
    }

    /**
     * Bring the application out of maintenance mode
     */
    public disableMaintenance(): void {
        removeSync(this.tempPath("maintenance"));

        // this.logger.warning("Application is now live.");
    }

    /**
     * Determine if the application is currently down for maintenance.
     */
    public isDownForMaintenance(): boolean {
        return existsSync(this.tempPath("maintenance"));
    }

    /**
     * Terminate the application.
     */
    public terminate(): void {
        this.bootstrapped = false;

        // @TODO
    }

    /**
     * Bind all of the application environment in the container.
     */
    private bindEnvironment(config: Record<string, any>): void {
        this.bind("app.env", config.env);

        this.bind("app.token", config.token);

        this.bind("app.network", config.network);

        if (!semver.valid(config.version)) {
            throw new InvalidVersion(config.version);
        }

        this.bind("app.version", config.version);
    }

    /**
     * Bind the application namespace in the container.
     */
    private bindNamespace(): void {
        const token = this.token();
        const network = this.network();

        if (!token || !network) {
            throw new Error("Unable to detect application token or network.");
        }

        this.namespace = `${token}/${network}`;

        this.bind("app.namespace", this.namespace);
    }

    /**
     * Bind all of the application paths in the container.
     */
    private bindPathsInContainer(paths: Record<string, string>): void {
        for (const [type, path] of Object.entries(paths)) {
            this[camelCase(`use_${type}_path`)](path);

            this.bind(`path.${type}`, path);
        }
    }

    /**
     * Get the path to a directory.
     */
    private getPath(type: string): string {
        const path = this.resolve(`path.${type}`);

        if (!existsSync(path)) {
            throw new DirectoryNotFound(path);
        }

        return path;
    }

    /**
     * Set the directory for the given type.
     */
    private usePath(type: string, path: string): void {
        if (!existsSync(path)) {
            throw new DirectoryNotFound(path);
        }

        this.bind(`path.${type}`, path);
    }
}
