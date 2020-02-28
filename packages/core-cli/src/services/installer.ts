import { sync } from "execa";

import { injectable } from "../ioc";

/**
 * @export
 * @class Installer
 */
@injectable()
export class Installer {
    /**
     * @param {string} pkg
     * @memberof Installer
     */
    public install(pkg: string): void {
        const { stdout, stderr } = sync(`yarn global add ${pkg}`, {
            shell: true,
        });

        if (stderr) {
            throw new Error(stderr);
        }

        console.log(stdout);
    }

    /**
     * @param {string} pkg
     * @param {string} channel
     * @memberof Installer
     */
    public installFromChannel(pkg: string, channel: string): void {
        const { stdout, stderr } = sync(`yarn global add ${pkg}@${channel}`, { shell: true });

        if (stderr) {
            throw new Error(stderr);
        }

        console.log(stdout);
    }
}
