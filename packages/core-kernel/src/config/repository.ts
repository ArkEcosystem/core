import { JsonObject } from "type-fest";

/**
 * @export
 * @class ConfigRepository
 * @extends {Map<string, any>}
 */
export class ConfigRepository extends Map<string, any> {
    /**
     * @param {JsonObject} config
     * @memberof ConfigRepository
     */
    public constructor(config: JsonObject) {
        super(Object.entries(config));
    }
}
