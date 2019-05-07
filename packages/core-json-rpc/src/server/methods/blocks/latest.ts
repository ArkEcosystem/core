import Boom from "boom";
import { network } from "../../services/network";

export const blockLatest = {
    name: "blocks.latest",
    async method() {
        const response = await network.sendGET("blocks", { orderBy: "height:desc", limit: 1 });

        return response ? response.data[0] : Boom.notFound(`Latest block could not be found.`);
    },
};
