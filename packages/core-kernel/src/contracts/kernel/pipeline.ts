/**
 * @export
 * @interface Stage
 */
export interface Stage {
    /**
     * Process the payload.
     *
     * @remarks
     * We generally avoid the use of any but with pipeline stages the payload could be any of
     * that type until it hits the end of the pipeline where it is returned in its final form.
     *
     * @param {*} payload
     * @memberof Stage
     */
    process(payload: any);
}

/**
 * @export
 * @class Pipeline
 */
export interface Pipeline {
    /**
     * Create a new pipeline with an appended stage.
     *
     * @param {Function} stage
     * @returns {Pipeline}
     * @memberof Pipeline
     */
    pipe(stage: Function | Stage): Pipeline;

    /**
     * Process the payload. (Asynchronous)
     *
     * @template T
     * @param {T} payload
     * @returns {(Promise<T | undefined>)}
     * @memberof Pipeline
     */
    process<T>(payload: T): Promise<T | undefined>;

    /**
     * Process the payload. (Synchronous)
     *
     * @template T
     * @param {T} payload
     * @returns {(T | undefined)}
     * @memberof Pipeline
     */
    processSync<T>(payload: T): T | undefined;
}
