export * from "type-fest";

export type ConfigObject = Record<string, any>;

export type EventName = string | symbol;
export type EventListener = (name: EventName, data: any) => void;
