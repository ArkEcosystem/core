import { Stream } from "../../contracts";

export const removeListeners = (emitter: NodeJS.EventEmitter, eventListenerPairs: Stream.EventListenerPair[]): void => {
    for (const eventListenerPair of eventListenerPairs) {
        emitter.removeListener(eventListenerPair.event, eventListenerPair.listener);
    }
};
