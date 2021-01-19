import { Commands, Container, Contracts, Services } from "@arkecosystem/core-cli";
import { prettyBytes, prettyTime } from "@arkecosystem/utils";
import Joi from "joi";
import dayjs from "dayjs";

/**
 * @export
 * @class Command
 * @extends {Commands.Command}
 */
@Container.injectable()
export class Command extends Commands.Command {
    /**
     * @private
     * @type {ProcessManager}
     * @memberof Command
     */
    @Container.inject(Container.Identifiers.ProcessManager)
    private readonly processManager!: Services.ProcessManager;

    /**
     * The console command signature.
     *
     * @type {string}
     * @memberof Command
     */
    public signature: string = "top";

    /**
     * The console command description.
     *
     * @type {string}
     * @memberof Command
     */
    public description: string = "List all Core daemons.";

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
        this.definition.setFlag("token", "The name of the token.", Joi.string().default("ark"));
    }

    /**
     * Execute the console command.
     *
     * @returns {Promise<void>}
     * @memberof Command
     */
    public async execute(): Promise<void> {
        const processes: Contracts.ProcessDescription[] = (
            this.processManager.list() || []
        ).filter((p: Contracts.ProcessDescription) => p.name.startsWith(this.getFlag("token")));

        if (!processes || !Object.keys(processes).length) {
            this.components.fatal("No processes are running.");
        }

        this.components.table(["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"], (table) => {
            for (const process of processes) {
                // @ts-ignore
                table.push([
                    process.pid,
                    process.name,
                    // @ts-ignore
                    process.pm2_env.version,
                    process.pm2_env.status,
                    prettyTime(dayjs().diff(process.pm2_env.pm_uptime)),
                    `${process.monit.cpu}%`,
                    prettyBytes(process.monit.memory),
                ]);
            }
        });
    }
}
