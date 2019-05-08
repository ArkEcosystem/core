import { Database } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class BlocksBusinessRepository implements Database.IBlocksBusinessRepository {
    constructor(private readonly databaseServiceProvider: () => Database.IDatabaseService) {}

    public async getBlockRewards(): Promise<any> {
        return this.databaseServiceProvider().connection.blocksRepository.getBlockRewards();
    }

    public async getLastForgedBlocks(): Promise<any> {
        return this.databaseServiceProvider().connection.blocksRepository.getLastForgedBlocks();
    }

    /* TODO: Remove with v1 */
    public async findAll(
        params: Database.IParameters,
    ): Promise<{
        rows: Interfaces.IBlockData[];
        count: number;
    }> {
        return this.databaseServiceProvider().connection.blocksRepository.findAll(this.parseSearchParams(params));
    }

    public async findAllByGenerator(
        generatorPublicKey: string,
        paginate: Database.ISearchPaginate,
    ): Promise<{
        rows: Interfaces.IBlockData[];
        count: number;
    }> {
        return this.findAll({ generatorPublicKey, ...paginate });
    }

    public async findByHeight(height: number): Promise<Interfaces.IBlockData> {
        return this.databaseServiceProvider().connection.blocksRepository.findByHeight(height);
    }

    public async findById(id: string): Promise<Interfaces.IBlockData> {
        return this.databaseServiceProvider().connection.blocksRepository.findById(id);
    }

    public async findByIdOrHeight(idOrHeight): Promise<Interfaces.IBlockData> {
        try {
            const block = await this.findByHeight(idOrHeight);

            return block || this.findById(idOrHeight);
        } catch (error) {
            return this.findById(idOrHeight);
        }
    }

    public async search(
        params: Database.IParameters,
    ): Promise<{
        rows: Interfaces.IBlockData[];
        count: number;
    }> {
        return this.databaseServiceProvider().connection.blocksRepository.search(this.parseSearchParams(params));
    }

    private parseSearchParams(params: Database.IParameters): Database.ISearchParameters {
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
