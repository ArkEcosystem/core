/**
 * Configuration of the team work.
 */
export interface Options {
    /**
     * Number of meetings this team should attend before delivering work. Defaults to 1.
     */
    meetings?: number;
}

type ElementOf<T> = T extends (infer E)[] ? E : T;

export class Team<Results extends any | any[] = void> {
    /**
     * Start a new team work.
     * @param options Configuration of the team work.
     */
    constructor(options?: Options);

    /**
     * Resulting work when all the meetings are done.
     */
    work: Promise<Results>;

    /**
     * Attend a single meeting.
     * @param note An optional note that will be included in the work's results. If an error is provided, the work will be immediately rejected with that error.
     */
    attend(note?: Error | ElementOf<Results>): void;

    /**
     * Wait for the current work to be done and start another team work.
     * @param options New configuration of the team work.
     */
    regroup(options?: Options) : Promise<void>;
}
