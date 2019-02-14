import { Hook } from "@oclif/config";
import { checkForUpdates, needsRefresh } from "../helpers/update";

// tslint:disable-next-line:only-arrow-functions
export const init: Hook<"init"> = async function({ id, config }) {
    const channels: string[] = ["alpha", "beta", "rc", "stable"];

    let channel: string = "stable";
    for (const item of channels) {
        if (this.config.version.includes(`-${item}`)) {
            channel = item;
        }
    }

    if (id === "update") {
        return;
    }

    if (!needsRefresh(config)) {
        return;
    }

    await checkForUpdates(this, channel);
};
