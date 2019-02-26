import { Database } from "@arkecosystem/core-interfaces";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class BlocksBusinessRepository implements Database.IBlocksBusinessRepository {
    constructor(private databaseServiceProvider: () => Database.IDatabaseService) {}

    /* TODO: Remove with v1 */
    public async findAll(params: Database.IParameters) {
        return this.databaseServiceProvider().connection.blocksRepository.findAll(this.parseSearchParams(params));
    }

    public async findAllByGenerator(generatorPublicKey: string, paginate: Database.SearchPaginate) {
        return await this.findAll({ ...{ generatorPublicKey }, ...paginate });
    }

    public async findLastByPublicKey(generatorPublicKey: string) {
        // we order by height,desc by default
        return await this.findAll({ generatorPublicKey });
    }

    public async findByHeight(height: number) {
        return await this.findAll({ ...{ height } });
    }

    public async findById(id: string) {
        return await this.databaseServiceProvider().connection.blocksRepository.findById(id);
    }

    public async search(params: Database.IParameters) {
        return await this.databaseServiceProvider().connection.blocksRepository.search(this.parseSearchParams(params));
    }

    private parseSearchParams(params: Database.IParameters): Database.SearchParameters {
        const blocksRepository = this.databaseServiceProvider().connection.blocksRepository;
        const searchParameters = new SearchParameterConverter(blocksRepository.getModel()).convert(params);
        if (!searchParameters.orderBy.length) {
            // default order-by
            searchParameters.orderBy.push({
                field: "height",
                direction: "desc",
            });
        }
        return searchParameters;
    }
}
