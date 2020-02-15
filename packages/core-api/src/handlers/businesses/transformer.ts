import { transformWallet } from "../wallets/transformer";

export const transformBusiness = (business: any) => {
    if (business.name === undefined) {
        return transformWallet(business);
    }

    return business;
};
