/**
 * @export
 * @interface IBootstrapper
 */
export interface IBootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof IBootstrapper
     */
    bootstrap(): Promise<void>;
}
