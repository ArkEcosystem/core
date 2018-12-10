import { Loader } from "./loader";

export const plugin = {
    pkg: require("../package.json"),
    alias: "config",
    async register(container, options) {
        const loader = new Loader();
        await loader.setUp(options);

        return loader;
    },
};
