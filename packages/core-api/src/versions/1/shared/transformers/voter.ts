export const transformVoterLegacy = (model: any) => {
    return {
        username: model.username,
        address: model.address,
        publicKey: model.publicKey,
        balance: `${model.balance}`,
    };
};
