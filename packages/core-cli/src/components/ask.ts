import { Application } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Prompt } from "./prompt";

/**
 * @export
 * @class Ask
 */
@injectable()
export class Ask {
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
     * @param {object} [opts={}]
     * @returns {Promise<string>}
     * @memberof Ask
     */
    public async render(message: string, opts: object = {}): Promise<string> {
        const { value } = await this.app.get<Prompt>(Identifiers.Prompt).render({
            ...{
                type: "text",
                name: "value",
                message,
            },
            ...opts,
        });

        return value as string;
    }
}
