import bugsnag from "bugsnag";
import { defaults } from "./defaults";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container, options) {
        bugsnag.register(options.apiKey, options.configuration);

        return bugsnag;
    },
};
