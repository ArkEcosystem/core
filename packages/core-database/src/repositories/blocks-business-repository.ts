import { Database } from "@arkecosystem/core-interfaces";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class BlocksBusinessRepository implements Database.IBlocksBusinessRepository {

    constructor(private databaseServiceProvider: () => Database.IDatabaseService) {
    }

    public async findAll(params: any) {
        /* In core-api/blocks repo. 'findAll' differs from search in that, it assumes 'equal' op for all passed in parameters
        whereas 'search' checks if certain fields use different ops(such as in, lte/gte, like) etc.
        Search seems more robust in that sense, and findAll should be doing the same
         TODO: Remove this method in favor of 'search'
         */
        return this.search(params);
    }

    public async findAllByGenerator(generatorPublicKey: string, paginate: any) {
        const params = { ...{ generatorPublicKey }, ...paginate };
        return await this.findAll(params);
    }

    public async findLastByPublicKey(generatorPublicKey: string) {
        // we order by height,desc by default
        return await this.findAll({ generatorPublicKey});
    }

    public async findByHeight(height: number) {
        const params = { ...{ height } };
        return await this.findAll(params);
    }

    public async findById(id: string) {
        return await this.databaseServiceProvider().connection.blocksRepository.findById(id);
    }

    public async search(params: any) {
        const blocksRepository = this.databaseServiceProvider().connection.blocksRepository;
        const searchParameters = new SearchParameterConverter(blocksRepository.getModel()).convert(params);
        if (!searchParameters.orderBy.length) {
            // default order-by
            searchParameters.orderBy.push({
                field: "height",
                direction: "desc"
            });
        }
        return await blocksRepository.search(searchParameters);
    }

}
