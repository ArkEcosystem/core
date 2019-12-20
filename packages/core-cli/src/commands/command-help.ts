import { blue } from "kleur";
import { PackageJson } from "type-fest";

import { AppHeader } from "../components";
import { Application } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";

/**
 * @export
 * @class CommandHelp
 */
@injectable()
export class CommandHelp {
    /**
     * @private
     * @type {Application}
     * @memberof Command
     */
    @inject(Identifiers.Application)
    protected readonly app!: Application;

    /**
     * @private
     * @type {Application}
     * @memberof DiscoverCommands
     */
    @inject(Identifiers.Package)
    protected readonly pkg!: PackageJson;

    /**
     * @returns {string}
     * @memberof CommandHelp
     */
    public render(command): string {
        let helpMessage: string = `${this.app.get<AppHeader>(Identifiers.AppHeader).render()}

${blue().bold("Description")}
${command.description}`;

        const args: string = this.buildArguments(command);

        if (args) {
            helpMessage += `${blue().bold("\n\nArguments")}
${args}`;
        }

        const flags: string = this.buildFlags(command);

        if (flags) {
            helpMessage += `${blue().bold("\n\nFlags")}
${flags}`;
        }

        return helpMessage;
    }

    /**
     * @private
     * @returns {string}
     * @memberof CommandHelp
     */
    private buildArguments(command): string {
        const args = command.definition.getArguments();

        if (Object.keys(args).length <= 0) {
            return "";
        }

        const { options, descriptions, longestProperty } = this.buildProperties(args);

        const output: string[] = [];
        for (let i = 0; i < options.length; i++) {
            output.push(`${options[i].padEnd(longestProperty, " ")}    ${descriptions[i]}`);
        }

        return output.join("\n");
    }

    /**
     * @private
     * @returns {string}
     * @memberof CommandHelp
     */
    private buildFlags(command): string {
        const flags = command.definition.getFlags();

        if (Object.keys(flags).length <= 0) {
            return "";
        }

        const { options, descriptions, longestProperty } = this.buildProperties(flags);

        const output: string[] = [];
        for (let i = 0; i < options.length; i++) {
            output.push(`--${options[i].padEnd(longestProperty, " ")}    ${descriptions[i]}`);
        }

        return output.join("\n");
    }

    /**
     * @private
     * @template T
     * @param {T} properties
     * @returns
     * @memberof CommandHelp
     */
    private buildProperties<T>(properties: T) {
        const options: string[] = [];
        const descriptions: string[] = [];

        for (const option of Object.keys(properties)) {
            options.push(option);
            descriptions.push(properties[option].description);
        }

        return {
            options,
            descriptions,
            longestProperty: options.reduce((a, b) => (a.length > b.length ? a : b)).length,
        };
    }
}
