import Boom from "boom";
import Joi from "joi";
import { network } from "../../services/network";

export const blockInfo = {
    name: "blocks.info",
    async method(params) {
        const response = await network.sendGET(`blocks/${params.id}`);

        return response ? response.data : Boom.notFound(`Block ${params.id} could not be found.`);
    },
    schema: {
        id: Joi.alternatives().try(
            Joi.number()
                .unsafe()
                .required(),
            Joi.string().length(64),
        ),
    },
};
