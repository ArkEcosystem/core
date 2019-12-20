import { ensureFileSync, readJsonSync, writeJsonSync } from "fs-extra";
import { PackageJson } from "type-fest";

import { Application } from "../contracts";
import { Identifiers, inject, injectable, postConstruct } from "../ioc";

/**
 * @export
 * @class Config
 */
@injectable()
export class Config {
    /**
     * @private
     * @type {Application}
     * @memberof DiscoverCommands
     */
    @inject(Identifiers.Application)
    private readonly app!: Application;

    /**
     * @private
     * @type {string}
     * @memberof Config
     */
    private file!: string;

    /**
     * @private
     * @type {object}
     * @memberof Config
     */
    private config: object = {};

    /**
     *Creates an instance of Config.
     * @param {Context} context
     * @memberof Config
     */
    @postConstruct()
    public initialize(): void {
        this.file = this.app.getConsolePath("config", "config.json");

        this.ensureDefaults();

        this.load();
    }

    /**
     * @template T
     * @param {string} key
     * @returns {T}
     * @memberof Config
     */
    public get<T>(key: string): T {
        return this.config[key];
    }

    /**
     * @template T
     * @param {string} key
     * @param {T} value
     * @memberof Config
     */
    public set<T>(key: string, value: T): void {
        this.config[key] = value;

        this.save();
    }

    /**
     * @param {string} key
     * @memberof Config
     */
    public forget(key: string): void {
        delete this.config[key];

        this.save();
    }

    /**
     * @param {string} key
     * @returns {boolean}
     * @memberof Config
     */
    public has(key: string): boolean {
        return Object.keys(this.config).includes(key);
    }

    /**
     * @private
     * @returns {*}
     * @memberof Config
     */
    private load(): any {
        try {
            this.config = readJsonSync(this.file);
        } catch (error) {
            this.ensureDefaults();

            this.load();
        }
    }

    /**
     * @private
     * @memberof Config
     */
    private save(): void {
        ensureFileSync(this.file);

        writeJsonSync(this.file, this.config);
    }

    /**
     * @private
     * @memberof Config
     */
    private ensureDefaults(): void {
        if (!this.has("token")) {
            this.set("token", "ark");
        }

        if (!this.has("channel")) {
            this.set("channel", this.getRegistryChannel(this.app.get<PackageJson>(Identifiers.Package).version!));
        }

        if (!this.has("plugins")) {
            this.set("plugins", []);
        }
    }

    /**
     * @private
     * @param {string} version
     * @returns {string}
     * @memberof Config
     */
    private getRegistryChannel(version: string): string {
        const channels: string[] = ["alpha", "beta", "rc", "next"];

        let channel = "latest";
        for (const item of channels) {
            if (version.includes(`-${item}`)) {
                channel = item;
            }
        }

        return channel;
    }
}
