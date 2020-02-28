import { Application } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Prompt } from "./prompt";

/**
 * @export
 * @class MultiSelect
 */
@injectable()
export class MultiSelect {
    /**
     * @private
     * @type {Application}
     * @memberof Command
     */
    @inject(Identifiers.Application)
    private readonly app!: Application;

    /**
     * @static
     * @param {string} message
     * @param {any[]} choices
     * @param {object} [opts={}]
     * @returns {Promise<string[]>}
     * @memberof MultiSelect
     */
    public async render(message: string, choices: any[], opts: object = {}): Promise<string[]> {
        const { value } = await this.app.get<Prompt>(Identifiers.Prompt).render({
            ...{
                type: "multiselect",
                name: "value",
                message,
                choices,
            },
            ...opts,
        });

        return value as string[];
    }
}
