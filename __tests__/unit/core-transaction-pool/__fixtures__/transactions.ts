import { Utils } from "@arkecosystem/crypto";
import { TransactionFactory } from "../../../helpers/transaction-factory";
import { delegates } from "../../../utils/fixtures/unitnet/delegates";

export const transactions = {
    dummy1: TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
        .withNonce(Utils.BigNumber.make(0))
        .withNetwork("testnet")
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dummy2: TransactionFactory.transfer("AJ5eV59hu4xrbRCpoP3of7fEYWUteSVa8k", 10000000)
        .withNonce(Utils.BigNumber.make(1))
        .withNetwork("testnet")
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dummy3: TransactionFactory.transfer("ANqvJEMZcmUpcKBC8xiP1TntVkJeuZ3Lw3")
        .withNonce(Utils.BigNumber.make(2))
        .withNetwork("testnet")
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dummy4: TransactionFactory.transfer("AJ5eV59hu4xrbRCpoP3of7fEYWUteSVa8k")
        .withNonce(Utils.BigNumber.make(3))
        .withNetwork("testnet")
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dummy5: TransactionFactory.transfer("ASvC1E9hMLfANTi63S2gUMvr7rVZYJBj3u")
        .withNonce(Utils.BigNumber.make(4))
        .withNetwork("testnet")
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dummy6: TransactionFactory.transfer("Ac8utEr7XRebWRvArSBnbVoxbq6bXftAmL")
        .withNonce(Utils.BigNumber.make(5))
        .withNetwork("testnet")
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dummy7: TransactionFactory.transfer("ANWEaVfvAh3VTyZNYcuFESUum1XBmAvAdj")
        .withNonce(Utils.BigNumber.make(6))
        .withNetwork("testnet")
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dummy8: TransactionFactory.transfer("ALsZS24Dn4HYXwed5kAC5fKyB9BFzdmcSx")
        .withNonce(Utils.BigNumber.make(7))
        .withNetwork("testnet")
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dummy9: TransactionFactory.transfer("ANuaLhRuBJhTcHao7kTfDcfsewLQGr7x5G")
        .withNonce(Utils.BigNumber.make(8))
        .withNetwork("testnet")
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dummy10: TransactionFactory.transfer("AJ5eV59hu4xrbRCpoP3of7fEYWUteSVa8k")
        .withNonce(Utils.BigNumber.make(0))
        .withNetwork("testnet")
        .withPassphrase(delegates[1].passphrase)
        .build()[0],

    dummyLarge1: TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
        .withNonce(Utils.BigNumber.make(1))
        .withNetwork("testnet")
        .withPassphrase(delegates[1].passphrase)
        .build()[0],

    dummyLarge2: TransactionFactory.transfer("AJ5eV59hu4xrbRCpoP3of7fEYWUteSVa8k")
        .withNonce(Utils.BigNumber.make(2))
        .withNetwork("testnet")
        .withPassphrase(delegates[1].passphrase)
        .build()[0],

    dynamicFeeNormalDummy1: TransactionFactory.transfer("AcjGpvDJEQdBVwspYsAs16B8Rv66zo7gyd")
        .withNonce(Utils.BigNumber.make(9))
        .withNetwork("testnet")
        .withFee(280000)
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dynamicFeeLowDummy2: TransactionFactory.transfer("AabMvWPVKbdTHRcGBpATq9TEMiMD5xeJh9")
        .withNonce(Utils.BigNumber.make(10))
        .withNetwork("testnet")
        .withFee(100)
        .withPassphrase(delegates[0].passphrase)
        .build()[0],

    dummyExp1: TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
        .withNonce(Utils.BigNumber.make(3))
        .withNetwork("testnet")
        .withPassphrase(delegates[1].passphrase)
        .build()[0],

    dummyExp2: TransactionFactory.transfer("AabMvWPVKbdTHRcGBpATq9TEMiMD5xeJh9")
        .withNonce(Utils.BigNumber.make(4))
        .withNetwork("testnet")
        .withPassphrase(delegates[1].passphrase)
        .build()[0],
};
