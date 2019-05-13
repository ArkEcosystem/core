import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import Boom from "boom";
import Hapi from "hapi";
import { transformBlock } from "../blocks/transformer";
import { transformDelegate } from "../delegates/transformer";
import { transformPeer } from "../peers/transformer";
import { transformRoundDelegate } from "../rounds/transformer";
import { transformFeeStatistics } from "../shared/transformers/fee-statistics";
import { transformPorts } from "../shared/transformers/ports";
import { transformTransaction } from "../transactions/transformer";
import { transformWallet } from "../wallets/transformer";

export class Controller {
    protected readonly config = app.getConfig();
    protected readonly blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    protected readonly databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    protected paginate(request: Hapi.Request): any {
        const pagination = {
            // @ts-ignore
            offset: (request.query.page - 1) * request.query.limit || 0,
            // @ts-ignore
            limit: request.query.limit || 100,
        };

        // @ts-ignore
        if (request.query.offset) {
            // @ts-ignore
            pagination.offset = request.query.offset;
        }

        return pagination;
    }

    protected respondWithResource(data, transformer): any {
        return data ? { data: this.toResource(data, transformer) } : Boom.notFound();
    }

    protected respondWithCollection(data, transformer): object {
        return {
            data: this.toCollection(data, transformer),
        };
    }

    protected respondWithCache(data, h) {
        const { value, cached } = data;
        const lastModified = cached ? new Date(cached.stored) : new Date();

        return value.isBoom
            ? h.response(value.output.payload).code(value.output.statusCode)
            : h.response(value).header("Last-modified", lastModified.toUTCString());
    }

    protected toResource(data, transformer): object {
        return {
            block: transformBlock,
            delegate: transformDelegate,
            "fee-statistics": transformFeeStatistics,
            peer: transformPeer,
            ports: transformPorts,
            "round-delegate": transformRoundDelegate,
            transaction: transformTransaction,
            wallet: transformWallet,
        }[transformer](data);
    }

    protected toCollection(data, transformer): object {
        return data.map(d => this.toResource(d, transformer));
    }

    protected toPagination(data, transformer): object {
        return {
            results: this.toCollection(data.rows, transformer),
            totalCount: data.count,
        };
    }
}
