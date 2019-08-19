import { JsonObject } from "type-fest";
import { ConfigFactory, ConfigRepository } from "../../config";
import { IConfigAdapter } from "../../contracts/core-kernel";
import { EventDispatcher } from "../../services/events";
import { FilesystemFactory } from "../../services/filesystem";
import { LocalAdapter } from "../../services/filesystem/adapters/local";
import { LoggerFactory } from "../../services/logger";
import { ConsoleLogger } from "../../services/logger/adapters/console";
import { AbstractBootstrapper } from "../bootstrapper";

/**
 * @export
 * @class LoadServices
 */
export class LoadServices extends AbstractBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof LoadServices
     */
    public async bootstrap(): Promise<void> {
        await this.registerFilesystem();

        this.registerEventDispatcher();

        await this.registerLogger();

        this.registerConfigLoader();
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof LoadServices
     */
    private async registerFilesystem(): Promise<void> {
        this.app.bind(
            "filesystem",
            await this.app.resolve<FilesystemFactory>("factoryFilesystem").make(new LocalAdapter()),
        );
    }

    /**
     * @private
     * @memberof LoadServices
     */
    private registerEventDispatcher(): void {
        this.app.singleton("events", EventDispatcher);
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof LoadServices
     */
    private async registerLogger(): Promise<void> {
        this.app.bind("logger", await this.app.resolve<LoggerFactory>("factoryLogger").make(new ConsoleLogger()));
    }

    /**
     * @private
     * @memberof LoadServices
     */
    private registerConfigLoader(): void {
        const config: JsonObject = this.app.resolve<JsonObject>("config");

        this.app.bind<IConfigAdapter>(
            "configLoader",
            ConfigFactory.make(this.app, (config.configLoader || "local") as string),
        );

        this.app.bind<ConfigRepository>("config", new ConfigRepository(config));
    }
}
