import { Container } from "@arkecosystem/core-container";
import Sentry from "@sentry/node";
import { defaults } from "./defaults";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "error-tracker",
    async register(container: Container, options) {
        Sentry.init(options);

        return Sentry;
    },
};
