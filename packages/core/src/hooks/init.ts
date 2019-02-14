import { Hook } from "@oclif/config";
import { checkForUpdates, needsRefresh } from "../helpers/update";

// tslint:disable-next-line:only-arrow-functions
export const init: Hook<"init"> = async function({ id, config }) {
    if (id === "update") {
        return;
    }

    if (!needsRefresh(config)) {
        return;
    }

    await checkForUpdates(this);
};
