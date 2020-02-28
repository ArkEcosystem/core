import { Application } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Prompt } from "./prompt";

/**
 * @export
 * @class Select
 */
@injectable()
export class Select {
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
     * @memberof Select
     */
    public async render(message: string, choices: any[], opts: object = {}): Promise<string> {
        const { value } = await this.app.get<Prompt>(Identifiers.Prompt).render({
            ...{
                type: "toggle",
                name: "value",
                message,
                choices,
            },
            ...opts,
        });

        return value as string;
    }
}
