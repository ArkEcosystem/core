import { Hook } from "@oclif/config";
import { configManager } from "../../helpers/config";

// tslint:disable-next-line:only-arrow-functions
export const init: Hook<"init"> = async function({ config }) {
    configManager.setup(config);
};
