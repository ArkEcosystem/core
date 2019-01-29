import * as Joi from "joi";
import { Application } from "./application";

export abstract class AbstractPlugin {
    /**
     * Create a new plugin instance.
     */
    public constructor(readonly app: Application) {}

    /**
     * Register any services or bindings.
     */
    public abstract async register(): Promise<void>;

    /**
     * Dispose any services or bindings.
     */
    public abstract async dispose(): Promise<void>;

    /**
     * The name of the plugin.
     */
    public abstract getName(): string;

    /**
     * The version of the plugin.
     */
    public abstract getVersion(): string;

    /**
     * The default options of the plugin as a Joi schema.
     */
    public abstract getDefaults(): Joi.Schema;
}
