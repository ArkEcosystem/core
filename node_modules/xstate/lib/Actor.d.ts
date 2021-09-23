import { EventObject, Subscribable, InvokeDefinition, AnyEventObject } from './types';
export interface Actor<TContext = any, TEvent extends EventObject = AnyEventObject> extends Subscribable<TContext> {
    id: string;
    send: (event: TEvent) => any;
    stop?: () => any | undefined;
    toJSON: () => {
        id: string;
    };
    meta?: InvokeDefinition<TContext, TEvent>;
    state?: any;
}
export declare function createNullActor(id: string): Actor;
/**
 * Creates a null actor that is able to be invoked given the provided
 * invocation information in its `.meta` value.
 *
 * @param invokeDefinition The meta information needed to invoke the actor.
 */
export declare function createInvocableActor<TC, TE extends EventObject>(invokeDefinition: InvokeDefinition<TC, TE>): Actor;
export declare function isActor(item: any): item is Actor;
//# sourceMappingURL=Actor.d.ts.map