export const transformAccountLegacy = model => {
    const hasSecondSignature: boolean = !!model.secondPublicKey;

    return {
        address: model.address,
        publicKey: model.publicKey,
        secondPublicKey: model.secondPublicKey,
        votes: model.votes,
        username: model.username,
        balance: `${model.balance}`,
        unconfirmedBalance: `${model.balance}`,
        multisignatures: [],
        u_multisignatures: [],
        unconfirmedSignature: hasSecondSignature ? 1 : 0,
        secondSignature: hasSecondSignature ? 1 : 0,
    };
};
