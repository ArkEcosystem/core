export type EventName = string | symbol;

export type EventListener = (name: EventName, data: any) => void;
