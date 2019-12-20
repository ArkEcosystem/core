import { dim, green, reset } from "kleur";
import latestVersion from "latest-version";
import { lte } from "semver";
import { PackageJson } from "type-fest";

import { Application } from "../application";
import { Confirm, Spinner, Warning } from "../components";
import { Config } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Installer } from "./installer";

const ONE_DAY = 1000 * 60 * 60 * 24;

/**
 * @export
 * @class Updater
 */
@injectable()
export class Updater {
    /**
     * @private
     * @type {Application}
     * @memberof ComponentFactory
     */
    @inject(Identifiers.Application)
    private readonly app!: Application;

    /**
     * @private
     * @type {Application}
     * @memberof DiscoverCommands
     */
    @inject(Identifiers.Config)
    private readonly config!: Config;

    /**
     * @private
     * @type {Application}
     * @memberof DiscoverCommands
     */
    @inject(Identifiers.Package)
    private readonly pkg!: PackageJson;

    /**
     * @private
     * @type {Installer}
     * @memberof Command
     */
    @inject(Identifiers.Installer)
    private readonly installer!: Installer;

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
            this.config.forget("latestVersion");
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
     * @param {boolean} [force=false]
     * @returns {Promise<boolean>}
     * @memberof Updater
     */
    public async update(force: boolean = false): Promise<boolean> {
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

        const spinner = this.app.get<Spinner>(Identifiers.Spinner).render(`Installing ${this.packageVersion}`);

        spinner.start();

        this.installer.installFromChannel(this.packageName, this.packageChannel);

        spinner.succeed();

        return true;
    }

    /**
     * @private
     * @returns {(Promise<string | undefined>)}
     * @memberof Updater
     */
    private async getLatestVersion(): Promise<string | undefined> {
        try {
            const latest: string | undefined = await latestVersion(this.packageName, {
                version: this.packageChannel,
            });

            if (lte(latest, this.packageVersion)) {
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
