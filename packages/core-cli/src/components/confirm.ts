import { Application } from "../contracts";
import { Identifiers, inject, injectable } from "../ioc";
import { Prompt } from "./prompt";

/**
 * @export
 * @class Confirm
 */
@injectable()
export class Confirm {
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
     * @returns {Promise<boolean>}
     * @memberof Confirm
     */
    public async render(message: string, opts: object = {}): Promise<boolean> {
        const { value } = await this.app.get<Prompt>(Identifiers.Prompt).render({
            ...{
                type: "confirm",
                name: "value",
                message,
            },
            ...opts,
        });

        return value as boolean;
    }
}
