"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createNullActor(id) {
    return {
        id: id,
        send: function () { return void 0; },
        subscribe: function () { return ({
            unsubscribe: function () { return void 0; }
        }); },
        toJSON: function () { return ({
            id: id
        }); }
    };
}
exports.createNullActor = createNullActor;
/**
 * Creates a null actor that is able to be invoked given the provided
 * invocation information in its `.meta` value.
 *
 * @param invokeDefinition The meta information needed to invoke the actor.
 */
function createInvocableActor(invokeDefinition) {
    var tempActor = createNullActor(invokeDefinition.id);
    tempActor.meta = invokeDefinition;
    return tempActor;
}
exports.createInvocableActor = createInvocableActor;
function isActor(item) {
    try {
        return typeof item.send === 'function';
    }
    catch (e) {
        return false;
    }
}
exports.isActor = isActor;
