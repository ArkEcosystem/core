import { Hook } from "@oclif/config";
import Chalk from "chalk";
import cli from "cli-ux";
import { checkForUpdates, needsRefresh } from "../../helpers/update";

// tslint:disable-next-line:only-arrow-functions
export const init: Hook<"init"> = async function({ id, config }) {
    if (id === "update") {
        return;
    }

    if (!needsRefresh(config)) {
        return;
    }

    const state = await checkForUpdates(this);

    if (!state.ready) {
        this.warn(
            `${state.name} update available from ${Chalk.greenBright(state.currentVersion)} to ${Chalk.greenBright(
                state.updateVersion,
            )}. Review the latest release and run "ark update" once you wish to update.`,
        );

        const branch = {
            alpha: "develop",
            beta: "develop",
            rc: "develop",
            latest: "master",
        }[state.channel];

        await cli.url(
            `Click here to read the changelog for ${state.currentVersion}.`,
            `https://github.com/ArkEcosystem/core/blob/${branch}/CHANGELOG.md`,
        );
    }
};
