import { Span as SpanInterface } from '@sentry/types';
export declare const TRACEPARENT_REGEXP: RegExp;
/**
 * Span containg all data about a span
 */
export declare class Span implements SpanInterface {
    private readonly _traceId;
    private readonly _spanId;
    private _sampled?;
    private _parent?;
    constructor(_traceId?: string, _spanId?: string, _sampled?: boolean | undefined, _parent?: Span | undefined);
    /**
     * Setter for parent
     */
    setParent(parent: Span | undefined): this;
    /**
     * Setter for sampled
     */
    setSampled(sampled: boolean | undefined): this;
    /**
     * Continues a trace
     * @param traceparent Traceparent string
     */
    static fromTraceparent(traceparent: string): Span | undefined;
    /**
     * @inheritDoc
     */
    toTraceparent(): string;
    /**
     * @inheritDoc
     */
    toJSON(): object;
}
//# sourceMappingURL=span.d.ts.map