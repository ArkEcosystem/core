import { Database } from "@arkecosystem/core-interfaces";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class BlocksBusinessRepository implements Database.IBlocksBusinessRepository {
    constructor(private databaseServiceProvider: () => Database.IDatabaseService) {}

    /* TODO: Remove with v1 */
    public async findAll(params: Database.IParameters) {
        return this.databaseServiceProvider().connection.blocksRepository.findAll(this.parseSearchParams(params));
    }

    public async findAllByGenerator(generatorPublicKey: string, paginate: Database.SearchPaginate) {
        return this.findAll({ generatorPublicKey, ...paginate });
    }

    public async findLastByPublicKey(generatorPublicKey: string) {
        // we order by height,desc by default
        return this.findAll({ generatorPublicKey });
    }

    public async findByHeight(height: number) {
        return this.databaseServiceProvider().connection.blocksRepository.findByHeight(height);
    }

    public async findById(id: string) {
        return this.databaseServiceProvider().connection.blocksRepository.findById(id);
    }

    public async findByIdOrHeight(idOrHeight) {
        try {
            const block = await this.findByHeight(idOrHeight);

            return block || this.findById(idOrHeight);
        } catch (error) {
            return this.findById(idOrHeight);
        }
    }

    public async search(params: Database.IParameters) {
        return this.databaseServiceProvider().connection.blocksRepository.search(this.parseSearchParams(params));
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
