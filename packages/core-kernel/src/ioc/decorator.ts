import { decorate, injectable } from "inversify";

export const decorateInjectable = (target: any) => {
    try {
        decorate(injectable(), target);
    } catch {}
};
