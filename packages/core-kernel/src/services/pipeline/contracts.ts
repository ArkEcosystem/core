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
