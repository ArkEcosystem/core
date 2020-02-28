import { Application } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Prompt } from "./prompt";

/**
 * @export
 * @class AutoComplete
 */
@injectable()
export class AutoComplete {
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
     * @returns {Promise<string>}
     * @memberof AutoComplete
     */
    public async render(message: string, choices: any[], opts: object = {}): Promise<string> {
        const { value } = await this.app.get<Prompt>(Identifiers.Prompt).render({
            ...{
                type: "autocomplete",
                name: "value",
                message,
                choices,
            },
            ...opts,
        });

        return value as string;
    }
}
