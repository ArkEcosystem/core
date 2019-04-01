import { TransactionFactory } from "../../../helpers/transaction-factory";
import { delegates } from "../../../utils/fixtures/unitnet/delegates";

export const transactions = {
    dummy1: TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
        .withNetwork("unitnet")
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dummy2: TransactionFactory.transfer("DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8", 10000000)
        .withNetwork("unitnet")
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dummy3: TransactionFactory.transfer("ANqvJEMZcmUpcKBC8xiP1TntVkJeuZ3Lw3")
        .withNetwork("unitnet")
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dummy4: TransactionFactory.transfer("AJ5eV59hu4xrbRCpoP3of7fEYWUteSVa8k")
        .withNetwork("unitnet")
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dummy5: TransactionFactory.transfer("ASvC1E9hMLfANTi63S2gUMvr7rVZYJBj3u")
        .withNetwork("unitnet")
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dummy6: TransactionFactory.transfer("Ac8utEr7XRebWRvArSBnbVoxbq6bXftAmL")
        .withNetwork("unitnet")
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dummy7: TransactionFactory.transfer("ANWEaVfvAh3VTyZNYcuFESUum1XBmAvAdj")
        .withNetwork("unitnet")
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dummy8: TransactionFactory.transfer("ALsZS24Dn4HYXwed5kAC5fKyB9BFzdmcSx")
        .withNetwork("unitnet")
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dummy9: TransactionFactory.transfer("ANuaLhRuBJhTcHao7kTfDcfsewLQGr7x5G")
        .withNetwork("unitnet")
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dummy10: TransactionFactory.transfer("DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8")
        .withNetwork("unitnet")
        .withPassphrase(delegates[1].passphrase)
        .create()[0],

    dummyLarge1: TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
        .withNetwork("unitnet")
        .withPassphrase(delegates[1].passphrase)
        .create()[0],

    dummyLarge2: TransactionFactory.transfer("DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8")
        .withNetwork("unitnet")
        .withPassphrase(delegates[1].passphrase)
        .create()[0],

    dynamicFeeNormalDummy1: TransactionFactory.transfer("AcjGpvDJEQdBVwspYsAs16B8Rv66zo7gyd")
        .withNetwork("unitnet")
        .withFee(280000)
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dynamicFeeLowDummy2: TransactionFactory.transfer("AabMvWPVKbdTHRcGBpATq9TEMiMD5xeJh9")
        .withNetwork("unitnet")
        .withFee(100)
        .withPassphrase(delegates[0].passphrase)
        .create()[0],

    dummyExp1: TransactionFactory.transfer("AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5")
        .withNetwork("unitnet")
        .withPassphrase(delegates[1].passphrase)
        .create()[0],

    dummyExp2: TransactionFactory.transfer("DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8")
        .withNetwork("unitnet")
        .withPassphrase(delegates[1].passphrase)
        .create()[0],
};
