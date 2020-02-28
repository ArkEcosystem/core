import { red, white } from "kleur";
import os from "os";
import { PackageJson } from "type-fest";

import { Identifiers, inject, injectable } from "../ioc";

/**
 * @export
 * @class AppHeader
 */
@injectable()
export class AppHeader {
    /**
     * @private
     * @type {Application}
     * @memberof Command
     */
    @inject(Identifiers.Package)
    private readonly pkg!: PackageJson;

    /**
     * @returns {string}
     * @memberof AppHeader
     */
    public render(): string {
        return `${red().bold(`${this.pkg.description}`)} ${white().bold(
            `[${this.pkg.version} | ${process.version} | ${os.platform()}@${os.arch()}]`,
        )}`;
    }
}
