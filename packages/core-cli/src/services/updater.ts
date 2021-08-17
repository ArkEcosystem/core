import { dim, green, reset } from "kleur";
import latestVersion from "latest-version";
import * as semver from "semver";
import { PackageJson } from "type-fest";

import { Application } from "../application";
import { Confirm, Spinner, Warning } from "../components";
import { Config } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Installer } from "./installer";
import { ProcessManager } from "./process-manager";
import * as Contracts from "../contracts";

const ONE_DAY = 1000 * 60 * 60 * 24;

/**
 * @export
 * @class Updater
 */
@injectable()
export class Updater implements Contracts.Updater {
    /**
     * @private
     * @type {Application}
     * @memberof Updater
     */
    @inject(Identifiers.Application)
    private readonly app!: Application;

    /**
     * @private
     * @type {Config}
     * @memberof Updater
     */
    @inject(Identifiers.Config)
    private readonly config!: Config;

    /**
     * @private
     * @type {PackageJson}
     * @memberof Updater
     */
    @inject(Identifiers.Package)
    private readonly pkg!: PackageJson;

    /**
     * @private
     * @type {Installer}
     * @memberof Updater
     */
    @inject(Identifiers.Installer)
    private readonly installer!: Installer;

    /**
     * @private
     * @type {ProcessManager}
     * @memberof Updater
     */
    @inject(Identifiers.ProcessManager)
    private readonly processManager!: ProcessManager;

    /**
     * @private
     * @type {*}
     * @memberof Updater
     */
    private updateCheckInterval: any = ONE_DAY;

    /**
     * @private
     * @type {(string | undefined)}
     * @memberof Updater
     */
    private latestVersion: string | undefined;

    /**
     * @returns {Promise<boolean>}
     * @memberof Updater
     */
    public async check(): Promise<boolean> {
        this.latestVersion = this.config.get("latestVersion");

        if (this.latestVersion) {
            this.config.forget("latestVersion"); // ? shouldn't it be moved after lastUpdateCheck
        }

        if (Date.now() - this.config.get<number>("lastUpdateCheck") < this.updateCheckInterval) {
            return false;
        }

        const latestVersion: string | undefined = await this.getLatestVersion();

        this.config.set("lastUpdateCheck", Date.now());

        if (latestVersion === undefined) {
            return false;
        }

        this.config.set("latestVersion", latestVersion);

        this.latestVersion = latestVersion;

        return true;
    }

    /**
     * @param {boolean} [updateProcessManager=false]
     * @param {boolean} [force=false]
     * @returns {Promise<boolean>}
     * @memberof Updater
     */
    public async update(updateProcessManager: boolean = false, force: boolean = false): Promise<boolean> {
        if (this.latestVersion === undefined) {
            return false;
        }

        if (!force) {
            const confirm = await this.app
                .get<Confirm>(Identifiers.Confirm)
                .render(
                    `Update available ${dim(this.packageVersion)} ${reset(" → ")} ${green(
                        this.latestVersion,
                    )}. Would you like to update?`,
                );

            if (!confirm) {
                throw new Error("You'll need to confirm the update to continue.");
            }
        }

        const spinner = this.app.get<Spinner>(Identifiers.Spinner).render(`Installing ${this.latestVersion}`);

        spinner.start();

        this.installer.install(this.packageName, this.packageChannel);

        if (updateProcessManager) {
            this.processManager.update();
        }

        spinner.succeed();

        return true;
    }

    /**
     * @private
     * @returns {(Promise<string | undefined>)}
     * @memberof Updater
     */
    public async getLatestVersion(): Promise<string | undefined> {
        try {
            const latest: string | undefined = await latestVersion(this.packageName, {
                version: this.packageChannel,
            });

            if (semver.lte(latest, this.packageVersion)) {
                return undefined;
            }

            return latest;
        } catch {
            this.app
                .get<Warning>(Identifiers.Warning)
                .render(`We were unable to find any releases for the "${this.packageChannel}" channel.`);

            return undefined;
        }
    }

    private get packageName(): string {
        return this.pkg.name!;
    }

    private get packageVersion(): string {
        return this.pkg.version!;
    }

    private get packageChannel(): string {
        return this.config.get("channel");
    }
}
