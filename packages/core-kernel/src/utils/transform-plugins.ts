import { PeerPlugins } from "../contracts/p2p";

// todo: review the implementation
export const transformPlugins = (plugins): PeerPlugins => {
    const result: PeerPlugins = {};

    const pkgs: { package: string; options: any }[] = Object.values(plugins);

    for (const pkg of pkgs) {
        const name = pkg.package;
        let options = pkg.options || {};

        if (options.server) {
            options = {
                enabled: options.enabled,
                ...options.server,
            };
        }

        const port = Number(options.port);
        const enabled = !!options.enabled;

        if (isNaN(port) || name.includes("core-p2p")) {
            continue;
        }

        result[name] = {
            enabled,
            port,
        };
    }

    return result;
};
