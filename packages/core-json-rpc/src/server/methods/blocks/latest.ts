import Boom from "boom";
import { network } from "../../services/network";

export const blockLatest = {
    name: "blocks.latest",
    async method(params) {
        const response = await network.sendRequest("blocks?orderBy=height:desc&limit=1");

        return response ? response.body[0] : Boom.notFound(`Latest block could not be found.`);
    },
};
