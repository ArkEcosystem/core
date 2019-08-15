/**
 * @export
 * @class ConfigRepository
 * @extends {Map<string, any>}
 */
export class ConfigRepository extends Map<string, any> {
    /**
     * @param {object} config
     * @memberof ConfigRepository
     */
    public constructor(config: object) {
        super(Object.entries(config));
    }
}
