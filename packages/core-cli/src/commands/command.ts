import envPaths from "env-paths";
import { PackageJson } from "type-fest";

import { ActionFactory } from "../action-factory";
import { ComponentFactory } from "../component-factory";
import { Box } from "../components";
import { Application, InputValue } from "../contracts";
import { Input } from "../input";
import { InputDefinition } from "../input/definition";
import { Identifiers, inject, injectable, postConstruct } from "../ioc";
import { Output } from "../output";
import { Config, Environment } from "../services";
import { CommandHelp } from "./command-help";
import { DiscoverConfig } from "./discover-config";
import { DiscoverNetwork } from "./discover-network";

/**
 * @export
 * @abstract
 * @class Command
 */
@injectable()
export abstract class Command {
    /**
     * @private
     * @type {Application}
     * @memberof Command
     */
    @inject(Identifiers.Application)
    protected readonly app!: Application;

    /**
     * @private
     * @type {Environment}
     * @memberof Command
     */
    @inject(Identifiers.Environment)
    protected readonly env!: Environment;

    /**
     * @private
     * @type {Output}
     * @memberof Command
     */
    @inject(Identifiers.Output)
    protected readonly output!: Output;

    /**
     * @private
     * @type {Contracts.Config}
     * @memberof Command
     */
    @inject(Identifiers.Config)
    protected readonly config!: Config;

    /**
     * @private
     * @type {Application}
     * @memberof Command
     */
    @inject(Identifiers.Package)
    protected readonly pkg!: PackageJson;

    /**
     * @private
     * @type {Application}
     * @memberof Command
     */
    @inject(Identifiers.ActionFactory)
    protected readonly actions!: ActionFactory;

    /**
     * @private
     * @type {Application}
     * @memberof Command
     */
    @inject(Identifiers.ComponentFactory)
    protected readonly components!: ComponentFactory;

    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature!: string;

    /**
     * The console command description.
     *
     * @type {(string | undefined)}
     * @memberof Command
     */
    public description: string | undefined;

    /**
     * Indicates whether the command should be shown in the command list.
     *
     * @type {boolean}
     * @memberof Command
     */
    public isHidden: boolean = false;

    /**
     * Indicates whether the command requires a network to be present.
     *
     * @type {boolean}
     * @memberof Command
     */
    public requiresNetwork: boolean = true;

    /**
     * @type {InputDefinition}
     * @memberof Command
     */
    protected definition: InputDefinition = new InputDefinition();

    /**
     * @type {Input}
     * @memberof Command
     */
    protected input!: Input;

    /**
     * Configure the console command.
     *
     * @remarks
     * This is executed before arguments are available in any way, shape or form.
     * If your task requires arguments to be parsed and validated you should consider to use the initialize method.
     *
     * @returns {void}
     * @memberof Command
     */
    /* istanbul ignore next */
    @postConstruct()
    // todo: for some reason this isn't recognized in tests for being called
    public configure(): void {
        // Do nothing...
    }

    /**
     * @memberof Command
     */
    public register(argv: string[]) {
        try {
            this.input = this.app.resolve(Input);
            this.input.parse(argv, this.definition);
            this.input.bind();
            this.input.validate();

            this.input.hasFlag("quiet")
                ? this.output.setVerbosity(0)
                : this.output.setVerbosity(this.input.getFlag("v") || 1);
        } catch (error) {
            this.components.fatal(error.message);
        }
    }

    /**
     * Initialize the command after the input has been bound and before the input is validated.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async initialize(): Promise<void> {
        // Do nothing...
    }

    /**
     * Interact with the user.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async interact(): Promise<void> {
        // Do nothing...
    }

    /**
     * Runs the command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async run(): Promise<void> {
        try {
            await this.detectConfig();

            if (this.requiresNetwork) {
                await this.detectNetwork();
            }

            // Check for configuration again after network was chosen
            await this.detectConfig();

            if (this.input.hasFlag("token") && this.input.hasFlag("network")) {
                this.app
                    .rebind(Identifiers.ApplicationPaths)
                    .toConstantValue(this.env.getPaths(this.input.getFlag("token"), this.input.getFlag("network")));
            }

            await this.initialize();

            if (this.input.isInteractive()) {
                await this.interact();
            }

            await this.execute();
        } catch (error) {
            this.components.fatal(error.message);
        }
    }

    /**
     * @memberof Command
     */
    public showHelp(): void {
        this.app.get<Box>(Identifiers.Box).render(this.app.resolve(CommandHelp).render(this));
    }

    /**
     * @returns {Record<string, any>}
     * @memberof Command
     */
    public getArguments(): Record<string, any> {
        return this.input.getArguments();
    }

    /**
     * @template T
     * @param {string} name
     * @returns {T}
     * @memberof Command
     */
    public getArgument(name: string) {
        return this.input.getArgument(name);
    }

    /**
     * @param {string} name
     * @param {InputValue} value
     * @memberof Input
     */
    public setArgument(name: string, value: InputValue): void {
        return this.input.setArgument(name, value);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof Command
     */
    public hasArgument(name: string): boolean {
        return this.input.hasArgument(name);
    }

    /**
     * @returns {Record<string, any>}
     * @memberof Command
     */
    public getFlags(): Record<string, any> {
        return this.input.getFlags();
    }

    /**
     * @template T
     * @param {string} name
     * @returns {T}
     * @memberof Command
     */
    public getFlag(name: string) {
        return this.input.getFlag(name);
    }

    /**
     * @param {string} name
     * @param {InputValue} value
     * @memberof Input
     */
    public setFlag(name: string, value: InputValue): void {
        return this.input.setFlag(name, value);
    }

    /**
     * @param {string} name
     * @returns {boolean}
     * @memberof Command
     */
    public hasFlag(name: string): boolean {
        return this.input.hasFlag(name);
    }

    private async detectConfig(): Promise<void> {
        const config = await this.app
            .resolve(DiscoverConfig)
            .discover(this.input.getFlag("token"), this.input.getFlag("network"));

        if (config) {
            this.input.setFlag("token", config.token);
            this.input.setFlag("network", config.network);
        }
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Command
     */
    private async detectNetwork(): Promise<void> {
        const requiresNetwork: boolean = Object.keys(this.definition.getFlags()).includes("network");

        if (requiresNetwork && !this.input.hasFlag("network")) {
            this.input.setFlag(
                "network",
                await this.app.resolve(DiscoverNetwork).discover(
                    envPaths(this.input.getFlag("token"), {
                        suffix: "core",
                    }).config,
                ),
            );
        }
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     * @memberof Command
     */
    public abstract execute(): Promise<void>;
}
