import { generators } from "../../../utils";
import { delegates } from "../../../utils/fixtures/unitnet/delegates";
const { generateTransfer } = generators;

export const transactions = {
    dummy1: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dummy2: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8",
        10000000,
        1,
        false,
        10000000,
    )[0],

    dummy3: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "ANqvJEMZcmUpcKBC8xiP1TntVkJeuZ3Lw3",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dummy4: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "AJ5eV59hu4xrbRCpoP3of7fEYWUteSVa8k",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dummy5: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "ASvC1E9hMLfANTi63S2gUMvr7rVZYJBj3u",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dummy6: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "Ac8utEr7XRebWRvArSBnbVoxbq6bXftAmL",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dummy7: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "ANWEaVfvAh3VTyZNYcuFESUum1XBmAvAdj",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dummy8: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "ALsZS24Dn4HYXwed5kAC5fKyB9BFzdmcSx",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dummy9: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "ANuaLhRuBJhTcHao7kTfDcfsewLQGr7x5G",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dummy10: generateTransfer(
        "unitnet",
        delegates[1].passphrase,
        "DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dummyLarge1: generateTransfer(
        "unitnet",
        delegates[1].passphrase,
        "AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dummyLarge2: generateTransfer(
        "unitnet",
        delegates[1].passphrase,
        "DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8",
        200000000,
        1,
        false,
        10000000,
    )[0],

    dynamicFeeNormalDummy1: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "AcjGpvDJEQdBVwspYsAs16B8Rv66zo7gyd",
        200000000,
        1,
        false,
        280000,
    )[0],

    dynamicFeeLowDummy2: generateTransfer(
        "unitnet",
        delegates[0].passphrase,
        "AabMvWPVKbdTHRcGBpATq9TEMiMD5xeJh9",
        200000000,
        1,
        false,
        100,
    )[0],

    // dynamicFeeZero: generateTransfer(
    //     "unitnet",
    //     delegates[0].passphrase,
    //     "AVnRZSvrAeeSJZN3oSBxEF6mvvVpuKUXL5",
    //     200000000,
    //     1,
    //     false,
    //     0,
    // )[0],

    dummyExp1: generateTransfer(
        "unitnet",
        delegates[1].passphrase,
        "AFzQCx5YpGg5vKMBg4xbuYbqkhvMkKfKe5",
        200000000,
        1,
    )[0],

    dummyExp2: generateTransfer(
        "unitnet",
        delegates[1].passphrase,
        "DFyDKsyvR4x9D9zrfEaPmeJxSniT5N5qY8",
        200000000,
        1,
    )[0],
};
