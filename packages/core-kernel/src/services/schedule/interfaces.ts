/**
 * @export
 * @interface Job
 */
export interface Job {
    /**
     * @param {() => void} callback
     * @memberof Job
     */
    execute(callback: () => void): void;
}
