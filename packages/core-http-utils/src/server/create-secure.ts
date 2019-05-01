import expandHomeDir from "expand-home-dir";
import { readFileSync } from "fs";
import { createServer } from "./create";

export const createSecureServer = async (options, callback, secure, plugins?: any[]) => {
    options.host = secure.host;
    options.port = secure.port;
    options.tls = {
        key: readFileSync(expandHomeDir(secure.key)),
        cert: readFileSync(expandHomeDir(secure.cert)),
    };

    return createServer(options, callback, plugins);
};
