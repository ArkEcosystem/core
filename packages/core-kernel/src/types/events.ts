export type EventName = string | symbol;

export type EventListener = (data: { name: EventName; data: any }) => void;
