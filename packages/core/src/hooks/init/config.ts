import { Hook } from "@oclif/config";

import { configManager } from "../../common/config";

export const init: Hook<"init"> = async function({ config }) {
    configManager.setup(config);

    if (config.version.includes("next") && configManager.get("channel") !== "next") {
        configManager.set("channel", "next");
    }
};
