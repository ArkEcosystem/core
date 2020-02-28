import { Application } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Prompt } from "./prompt";

/**
 * @export
 * @class AskNumber
 */
@injectable()
export class AskNumber {
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
     * @returns {Promise<number>}
     * @memberof AskNumber
     */
    public async render(message: string, opts: object = {}): Promise<number> {
        const { value } = await this.app.get<Prompt>(Identifiers.Prompt).render({
            ...{
                type: "number",
                name: "value",
                message,
            },
            ...opts,
        });

        return value as number;
    }
}
