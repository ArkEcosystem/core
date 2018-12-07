import { resolve } from "path";

import LegacyAccountTransformer from "../versions/1/accounts/transformer";
import LegacyBlockTransformer from "../versions/1/blocks/transformer";
import LegacyDelegateTransformer from "../versions/1/delegates/transformer";
import LegacyPeerTransformer from "../versions/1/peers/transformer";
import LegacyFeeStatisticsTransformer from "../versions/1/shared/transformers/fee-statistics";
import LegacyPortsTransformer from "../versions/1/shared/transformers/ports";
import LegacyVoterTransformer from "../versions/1/shared/transformers/voter";
import LegacyTransactionTransformer from "../versions/1/transactions/transformer";

import BlockTransformer from "../versions/2/blocks/transformer";
import DelegateTransformer from "../versions/2/delegates/transformer";
import PeerTransformer from "../versions/2/peers/transformer";
import FeeStatisticsTransformer from "../versions/2/shared/transformers/fee-statistics";
import PortsTransformer from "../versions/2/shared/transformers/ports";
import TransactionTransformer from "../versions/2/transactions/transformer";
import WalletTransformer from "../versions/2/wallets/transformer";

class Transformer {
  private transformers: Map<number, any> = new Map();

  public constructor() {
    this.transformers.set(1, {
      "fee-statistics": LegacyFeeStatisticsTransformer,
      account: LegacyAccountTransformer,
      block: LegacyBlockTransformer,
      delegate: LegacyDelegateTransformer,
      peer: LegacyPeerTransformer,
      ports: LegacyPortsTransformer,
      transaction: LegacyTransactionTransformer,
      voter: LegacyVoterTransformer
    });

    this.transformers.set(2, {
      "fee-statistics": FeeStatisticsTransformer,
      block: BlockTransformer,
      delegate: DelegateTransformer,
      peer: PeerTransformer,
      ports: PortsTransformer,
      transaction: TransactionTransformer,
      wallet: WalletTransformer
    });
  }

  public toResource(request, data, transformer): object {
    return this.transformers.get(request.pre.apiVersion)[transformer](data);
  }

  public toCollection(request, data, transformer): object[] {
    return data.map(d => this.toResource(request, d, transformer));
  }
}

export default new Transformer();
