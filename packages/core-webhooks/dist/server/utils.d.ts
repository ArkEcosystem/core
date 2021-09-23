import Boom from "@hapi/boom";
import { IWebhook } from "../interfaces";
export declare const transformResource: (model: any) => IWebhook;
export declare const respondWithResource: (data: any) => Boom.Boom<unknown> | {
    data: IWebhook;
};
