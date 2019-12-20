import prompts from "prompts";
import { JsonObject } from "type-fest";

import { injectable } from "../ioc";

/**
 * @export
 * @class Prompt
 */
@injectable()
export class Prompt {
    /**
     * @static
     * @param {object} options
     * @returns {Promise<JsonObject>}
     * @memberof Prompt
     */
    public async render(options: object): Promise<JsonObject> {
        return prompts(options);
    }
}
