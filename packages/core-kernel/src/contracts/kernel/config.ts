/**
 * @export
 * @interface IConfigLoader
 */
export interface IConfigLoader {
    /**
     * @returns {Promise<void>}
     * @memberof IConfigLoader
     */
    loadConfiguration(): Promise<void>;

    /**
     * @returns {Promise<void>}
     * @memberof IConfigLoader
     */
    loadEnvironmentVariables(): Promise<void>;
}
