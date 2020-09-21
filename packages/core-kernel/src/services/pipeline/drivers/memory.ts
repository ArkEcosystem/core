import { Pipeline, Stage } from "../../../contracts/kernel";
import { injectable } from "../../../ioc";

/**
 * @export
 * @class MemoryPipeline
 */
@injectable()
export class MemoryPipeline implements Pipeline {
    /**
     * Creates an instance of Pipeline.
     *
     * @param {(Array<Function | Stage>)} stages
     * @memberof MemoryPipeline
     */
    public constructor(private readonly stages: Array<Function | Stage> = []) {}

    /**
     * Create a new pipeline with an appended stage.
     *
     * @param {Function} stage
     * @returns {Pipeline}
     * @memberof MemoryPipeline
     */
    public pipe(stage: Function | Stage): Pipeline {
        const stages: Array<Function | Stage> = [...this.stages];

        stages.push(stage);

        return new MemoryPipeline(stages);
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
        for (const stage of this.stages) {
            if (typeof stage === "function") {
                payload = await stage(payload);
            } else {
                payload = await stage.process(payload);
            }
        }

        return payload;
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
        for (const stage of this.stages) {
            if (typeof stage === "function") {
                payload = stage(payload);
            } else {
                payload = stage.process(payload);
            }
        }

        return payload;
    }
}
