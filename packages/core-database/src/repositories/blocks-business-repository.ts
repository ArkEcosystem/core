import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class BlocksBusinessRepository implements Contracts.Database.BlocksBusinessRepository {
    constructor(private readonly databaseServiceProvider: () => Contracts.Database.DatabaseService) {}

    public async search(
        params: Contracts.Database.Parameters = {},
    ): Promise<{
        rows: Interfaces.IBlockData[];
        count: number;
    }> {
        return this.databaseServiceProvider().connection.blocksRepository.search(this.parseSearchParams(params));
    }

    public async findAllByGenerator(
        generatorPublicKey: string,
        paginate: Contracts.Database.SearchPaginate,
    ): Promise<{
        rows: Interfaces.IBlockData[];
        count: number;
    }> {
        return this.search({ generatorPublicKey, ...paginate });
    }

    public async findByHeight(height: number): Promise<Interfaces.IBlockData> {
        return this.databaseServiceProvider().connection.blocksRepository.findByHeight(height);
    }

    public async findById(id: string): Promise<Interfaces.IBlockData> {
        return this.databaseServiceProvider().connection.blocksRepository.findById(id);
    }

    public async findByIdOrHeight(idOrHeight): Promise<Interfaces.IBlockData> {
        try {
            const block: Interfaces.IBlockData = await this.findByHeight(idOrHeight);

            return block || this.findById(idOrHeight);
        } catch (error) {
            return this.findById(idOrHeight);
        }
    }

    public async getBlockRewards(): Promise<any> {
        return this.databaseServiceProvider().connection.blocksRepository.getBlockRewards();
    }

    public async getLastForgedBlocks(): Promise<any> {
        return this.databaseServiceProvider().connection.blocksRepository.getLastForgedBlocks();
    }

    public async getDelegatesForgedBlocks(): Promise<any> {
        return this.databaseServiceProvider().connection.blocksRepository.getDelegatesForgedBlocks();
    }

    private parseSearchParams(params: Contracts.Database.Parameters): Contracts.Database.SearchParameters {
        const blocksRepository: Contracts.Database.BlocksRepository = this.databaseServiceProvider().connection
            .blocksRepository;
        const searchParameters = new SearchParameterConverter(blocksRepository.getModel()).convert(params);

        if (!searchParameters.orderBy.length) {
            searchParameters.orderBy.push({
                field: "height",
                direction: "desc",
            });
        }

        return searchParameters;
    }
}
