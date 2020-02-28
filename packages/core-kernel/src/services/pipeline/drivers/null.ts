import { Pipeline, Stage } from "../../../contracts/kernel";
import { injectable } from "../../../ioc";

/**
 * @export
 * @class MemoryPipeline
 */
@injectable()
export class NullPipeline implements Pipeline {
    /**
     * Creates an instance of Pipeline.
     *
     * @param {(Array<Function | Stage>)} stages
     * @memberof MemoryPipeline
     */
    public constructor(stages: Array<Function | Stage> = []) {}

    /**
     * Create a new pipeline with an appended stage.
     *
     * @param {Function} stage
     * @returns {Pipeline}
     * @memberof MemoryPipeline
     */
    public pipe(stage: Function | Stage): Pipeline {
        return new NullPipeline([]);
    }

    /**
     * Process the payload. (Asynchronous)
     *
     * @template T
     * @param {T} payload
     * @returns {(Promise<T | undefined>)}
     * @memberof MemoryPipeline
     */
    public async process<T>(payload: T): Promise<T | undefined> {
        return undefined;
    }

    /**
     * Process the payload. (Synchronous)
     *
     * @template T
     * @param {T} payload
     * @returns {(T | undefined)}
     * @memberof MemoryPipeline
     */
    public processSync<T>(payload: T): T | undefined {
        return undefined;
    }
}
