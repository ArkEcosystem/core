export declare class EventLoopSpinner {
    private thresholdMs;
    private afterLastSpin;
    constructor(thresholdMs?: number);
    isStarving(): boolean;
    reset(): void;
    spin(): Promise<unknown>;
}
