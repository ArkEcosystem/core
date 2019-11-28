import { EventListener } from "../../contracts/kernel";

/**
 * @export
 * @class ExecuteCallbackWhenReady
 * @implements {EventListener}
 */
export class ExecuteCallbackWhenReady implements EventListener {
    /**
     * @private
     * @type {number}
     * @memberof ExecuteCallbackWhenReady
     */
    private blockCount!: number;

    /**
     * @private
     * @type {Function}
     * @memberof ExecuteCallbackWhenReady
     */
    private callback!: Function;

    /**
     * @param {Function} callback
     * @param {number} blockCount
     * @returns {this}
     * @memberof ExecuteCallbackWhenReady
     */
    public constructor(callback: Function, blockCount: number) {
        this.blockCount = blockCount;
        this.callback = callback;
    }

    /**
     * @param {*} {data}
     * @returns {Promise<void>}
     * @memberof ExecuteCallbackWhenReady
     */
    public async handle({ data }): Promise<void> {
        if (data.height % this.blockCount === 0) {
            await this.callback();
        }
    }
}
