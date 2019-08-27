/**
 * @export
 * @interface ConfigLoader
 */
export interface ConfigLoader {
    /**
     * @returns {Promise<void>}
     * @memberof ConfigLoader
     */
    loadConfiguration(): Promise<void>;

    /**
     * @returns {Promise<void>}
     * @memberof ConfigLoader
     */
    loadEnvironmentVariables(): Promise<void>;
}
