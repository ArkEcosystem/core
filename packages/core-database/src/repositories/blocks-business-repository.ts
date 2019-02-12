import { Database } from "@arkecosystem/core-interfaces";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class BlocksBusinessRepository implements Database.IBlocksBusinessRepository {

    constructor(private databaseServiceProvider: () => Database.IDatabaseService) {
    }

    public async findAll(params: any) {
        const blocksRepository = this.databaseServiceProvider().connection.blocksRepository;
        const searchParameters = new SearchParameterConverter(blocksRepository.getModel()).convert(params);
        return await blocksRepository.search(searchParameters);
    }

    public async findAllByGenerator(generatorPublicKey: string, paginate: any) {
        const params = { ...{ generatorPublicKey }, ...paginate };
        return await this.findAll(params);
    }

    public async findByHeight(height: number) {
        const params = { ...{ height } };
        return await this.findAll(params);
    }

    public async findById(id: string) {
        return await this.databaseServiceProvider().connection.blocksRepository.findById(id);
    }

    public async search(params: any) {
        return await this.findAll(params);
    }

}
