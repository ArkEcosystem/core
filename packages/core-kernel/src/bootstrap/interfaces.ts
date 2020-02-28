/**
 * @export
 * @interface Bootstrapper
 */
export interface Bootstrapper {
    /**
     * @returns {Promise<void>}
     * @memberof Bootstrapper
     */
    bootstrap(): Promise<void>;
}
