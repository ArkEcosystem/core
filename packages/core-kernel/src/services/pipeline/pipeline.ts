import { injectable } from "../../ioc";
import { Stage } from "./contracts";

/**
 * @export
 * @class Pipeline
 */
@injectable()
export class Pipeline {
    /**
     * Creates an instance of Pipeline.
     *
     * @param {(Array<Function | Stage>)} stages
     * @memberof Pipeline
     */
    public constructor(private readonly stages: Array<Function | Stage> = []) {}

    /**
     * Create a new pipeline with an appended stage.
     *
     * @param {Function} stage
     * @returns {Pipeline}
     * @memberof Pipeline
     */
    public pipe(stage: Function | Stage): Pipeline {
        const stages: Array<Function | Stage> = [...this.stages];

        stages.push(stage);

        return new Pipeline(stages);
    }

    /**
     * Process the payload. (Asynchronous)
     *
     * @template T
     * @param {T} payload
     * @returns {(Promise<T | undefined>)}
     * @memberof Pipeline
     */
    public async process<T>(payload: T): Promise<T | undefined> {
        for (const stage of this.stages) {
            if ("process" in stage) {
                payload = await stage.process(payload);
            } else if (typeof stage === "function") {
                payload = await stage(payload);
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
     * @memberof Pipeline
     */
    public processSync<T>(payload: T): T | undefined {
        for (const stage of this.stages) {
            if ("process" in stage) {
                payload = stage.process(payload);
            } else if (typeof stage === "function") {
                payload = stage(payload);
            }
        }

        return payload;
    }
}
