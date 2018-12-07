import { bignumify } from "@arkecosystem/core-utils";

export default function(model) {
  return {
    address: model.address,
    publicKey: model.publicKey,
    username: model.username,
    secondPublicKey: model.secondPublicKey,
    balance: +bignumify(model.balance).toFixed(),
    isDelegate: !!model.username,
  };
}
