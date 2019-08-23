import { BlockFrequencies } from "./block-frequencies";

/**
 * @export
 * @class BlockJob
 * @extends {BlockFrequencies}
 */
export class BlockJob extends BlockFrequencies {
    /**
     * @private
     * @memberof BlockJob
     */
    private job;

    /**
     * @private
     * @memberof BlockJob
     */
    private onTick: () => void;

    /**
     * @private
     * @memberof BlockJob
     */
    private onComplete: () => void;

    /**
     * @param {() => void} callback
     * @memberof BlockJob
     */
    public call(callback: () => void): void {
        this.onTick = callback;
    }

    /**
     * @param {() => void} callback
     * @memberof BlockJob
     */
    public whenCompleted(callback: () => void): void {
        this.onComplete = callback;
    }

    /**
     * @memberof BlockJob
     */
    public start(): void {
        // @TODO

        console.log(this.job);
        console.log(this.onTick);
        console.log(this.onComplete);
    }

    /**
     * @memberof BlockJob
     */
    public stop(): void {
        // @TODO
    }
}
