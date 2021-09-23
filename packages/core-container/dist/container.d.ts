import { Container as container } from "@arkecosystem/core-interfaces";
import { Resolver } from "awilix";
import { PluginRegistrar } from "./registrars/plugin";
export declare class Container implements container.IContainer {
    /**
     * May be used by CLI programs to suppress the shutdown messages.
     */
    silentShutdown: boolean;
    options: Record<string, any>;
    plugins: PluginRegistrar;
    shuttingDown: boolean;
    version: string;
    isReady: boolean;
    variables: Record<string, any>;
    config: any;
    private name;
    private readonly container;
    /**
     * Set up the app.
     * @param  {String} version
     * @param  {Object} variables
     * @param  {Object} options
     * @return {void}
     */
    setUp(version: string, variables: Record<string, any>, options?: Record<string, any>): Promise<void>;
    getConfig(): any;
    tearDown(): Promise<void>;
    register<T>(name: string, resolver: Resolver<T>): this;
    resolve<T = any>(key: string): T;
    resolvePlugin<T = any>(key: string): T;
    resolveOptions(key: any): container.IPluginConfig<any>;
    has(key: string): boolean;
    forceExit(message: string, error?: Error): void;
    exit(exitCode: number, message: string, error?: Error): void;
    getVersion(): string;
    setVersion(version: string): void;
    getName(): string;
    private registerExitHandler;
}
