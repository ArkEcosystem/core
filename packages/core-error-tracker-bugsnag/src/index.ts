import bugsnag from "@bugsnag/js";
import { defaults } from "./defaults";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container, options) {
        return bugsnag(options);
    },
};
