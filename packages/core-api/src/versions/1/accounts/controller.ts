import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";

export class AccountsController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.accounts.index(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.accounts.show(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async balance(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.accounts.balance(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async publicKey(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.accounts.publicKey(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async fee(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return super.respondWith({
                fee: this.config.getMilestone(this.blockchain.getLastHeight()).fees.staticFees.delegateRegistration,
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async delegates(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const account = await this.databaseService.wallets.findById(request.query.address);

            if (!account) {
                return super.respondWith("Address not found.", true);
            }

            if (!account.vote) {
                return super.respondWith(
                    // @ts-ignore
                    `Address ${request.query.address} hasn't voted yet.`,
                    true,
                );
            }

            const delegate = await this.databaseService.delegates.findById(account.vote);

            return super.respondWith({
                delegates: [super.toResource(request, delegate, "delegate")],
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async top(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const wallets = this.databaseService.wallets.top(super.paginate(request));

            const accounts = wallets.rows.map(account => ({
                address: account.address,
                balance: `${account.balance}`,
                publicKey: account.publicKey,
            }));

            return super.respondWith({ accounts });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async count(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const { count } = await this.databaseService.wallets.findAll();

            return super.respondWith({ count });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
