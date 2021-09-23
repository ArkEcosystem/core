import { Event, Response, Transport } from '@sentry/types';
/** Noop transport */
export declare class NoopTransport implements Transport {
    /**
     * @inheritDoc
     */
    sendEvent(_: Event): Promise<Response>;
    /**
     * @inheritDoc
     */
    close(_?: number): Promise<boolean>;
}
//# sourceMappingURL=noop.d.ts.map