import { Database } from "@arkecosystem/core-interfaces";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class BlocksBusinessRepository implements Database.IBlocksBusinessRepository {

    constructor(private databaseServiceProvider: () => Database.IDatabaseService) {
    }

    /* TODO: Remove with v1 */
    public async findAll(params: any) {
        return this.databaseServiceProvider().connection.blocksRepository.findAll(this.parseSearchParams(params));
    }

    public async findAllByGenerator(generatorPublicKey: string, paginate: any) {
        const params = { ...{ generatorPublicKey }, ...paginate };
        return await this.findAll(params);
    }

    public async findLastByPublicKey(generatorPublicKey: string) {
        // we order by height,desc by default
        return await this.findAll({ generatorPublicKey });
    }

    public async findByHeight(height: number) {
        const params = { ...{ height } };
        return await this.findAll(params);
    }

    public async findById(id: string) {
        return await this.databaseServiceProvider().connection.blocksRepository.findById(id);
    }

    public async search(params: any) {
        return await this.databaseServiceProvider().connection.blocksRepository.search(this.parseSearchParams(params));
    }

    private parseSearchParams(params: any): Database.SearchParameters {
        const blocksRepository = this.databaseServiceProvider().connection.blocksRepository;
        const searchParameters = new SearchParameterConverter(blocksRepository.getModel()).convert(params);
        if (!searchParameters.orderBy.length) {
            // default order-by
            searchParameters.orderBy.push({
                field: "height",
                direction: "desc"
            });
        }
        return searchParameters;
    }

}
