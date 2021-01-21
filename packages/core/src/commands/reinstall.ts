import { Commands, Container, Services } from "@arkecosystem/core-cli";
import Joi from "joi";

/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
@Container.injectable()
export class Command extends Commands.Command {
    /**
     * @private
     * @type {Installer}
     * @memberof Command
     */
    @Container.inject(Container.Identifiers.Installer)
    private readonly installer!: Services.Installer;

    @Container.inject(Container.Identifiers.ProcessManager)
    private readonly processManager!: Services.ProcessManager;

    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "reinstall";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "Reinstall the Core installation";

    /**
     * Indicates whether the command requires a network to be present.
     *
     * @type {boolean}
     * @memberof Command
     */
    public requiresNetwork: boolean = false;

    /**
     * Configure the console command.
     *
     * @returns {void}
     * @memberof Command
     */
    public configure(): void {
        this.definition.setFlag("force", "Force a reinstall.", Joi.boolean());
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        if (this.getFlag("force")) {
            return this.performInstall();
        }

        if (await this.components.confirm("Are you sure you want to reinstall?")) {
            //Come back to this
            return this.performInstall();
        }

        this.components.fatal("You'll need to confirm the reinstall to continue.");
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof Command
     */
    private async performInstall(): Promise<void> {
        const spinner = this.components.spinner(`Reinstalling ${this.pkg.version}`);

        spinner.start();

        this.installer.install(this.pkg.name!, this.pkg.version!);

        this.processManager.update();

        spinner.succeed();

        await this.actions.restartRunningProcessWithPrompt(`${this.getFlag("token")}-core`);
        await this.actions.restartRunningProcessWithPrompt(`${this.getFlag("token")}-relay`);
        await this.actions.restartRunningProcessWithPrompt(`${this.getFlag("token")}-forger`);
    }
}
