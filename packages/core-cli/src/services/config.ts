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
    private store: object = {};

    /**
     *Creates an instance of Config.
     * @param {Context} context
     * @memberof Config
     */
    @postConstruct()
    public initialize(): void {
        this.file = this.app.getConsolePath("config", "config.json");

        this.restoreDefaults();

        this.load();
    }

    /**
     * @returns {object}
     * @memberof Config
     */
    public all(): object {
        return this.store;
    }

    /**
     * @template T
     * @param {string} key
     * @returns {T}
     * @memberof Config
     */
    public get<T>(key: string): T {
        return this.store[key];
    }

    /**
     * @template T
     * @param {string} key
     * @param {T} value
     * @memberof Config
     */
    public set<T>(key: string, value: T): void {
        this.store[key] = value;

        this.save();
    }

    /**
     * @param {string} key
     * @memberof Config
     */
    public forget(key: string): void {
        delete this.store[key];

        this.save();
    }

    /**
     * @param {string} key
     * @returns {boolean}
     * @memberof Config
     */
    public has(key: string): boolean {
        return Object.keys(this.store).includes(key);
    }

    /**
     * @returns {*}
     * @memberof Config
     */
    public load(): any {
        try {
            this.store = readJsonSync(this.file);
        } catch (error) {
            this.restoreDefaults();

            this.load();
        }
    }

    /**
     * @memberof Config
     */
    public save(): void {
        ensureFileSync(this.file);

        writeJsonSync(this.file, this.store);
    }

    /**
     * @memberof Config
     */
    public restoreDefaults(): void {
        if (this.store.constructor !== Object) {
            this.store = {};
        }

        if (!this.has("token")) {
            this.set("token", "ark");
        }

        if (!this.has("channel")) {
            this.set("channel", this.getRegistryChannel(this.app.get<PackageJson>(Identifiers.Package).version!));
        }

        if (!this.has("plugins")) {
            this.set("plugins", []);
        }

        this.save();
    }

    /**
     * @private
     * @param {string} version
     * @returns {string}
     * @memberof Config
     */
    private getRegistryChannel(version: string): string {
        const channels: string[] = ["next"];

        let channel = "latest";
        for (const item of channels) {
            if (version.includes(`-${item}`)) {
                channel = item;
            }
        }

        return channel;
    }
}
