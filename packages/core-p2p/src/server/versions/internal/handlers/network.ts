import { monitor } from "../../../../monitor";

/**
 * @type {Object}
 */
export const state = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        return {
            data: await monitor.getNetworkState(),
        };
    },
};
