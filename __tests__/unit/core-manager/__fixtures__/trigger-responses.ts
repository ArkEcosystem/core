export const forgetCurrentDelegateResponse =
    '1 processes have received command forger.currentDelegate\n[ark-core:0:default]={"response":{"rank":16,"username":"genesis_25"}}';

export const forgetCurrentDelegateError =
    '1 processes have received command forger.currentDelegate\n[ark-core:0:default]={"error": "Dummy error"}';

export const forgetLastForgedBlockResponse =
    '1 processes have received command forger.lastForgedBlock\n[ark-core:0:default]={"response":{"serialized":"0000000020bcfa05582600001943efe17e1ae39f0000000000000000000000000000000000000000000000000000000000000000e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855034ff439276ab784098e66dca4075111008448a3b3519c10701bd2d1600ec1203a30440220724842543ed6f45cfcefdf6d30937a2c254bbe144250b88be1e0c449a2f8119a02203a2b6ef911113b3ab9bd3777c4c641c18982a2db06a162ca1d7075f3d9e62d55","verification":{"errors":[],"containsMultiSignatures":false,"verified":true},"transactions":[],"data":{"id":"11409120811156248728","idHex":"9e5556edfc7c1898","blockSignature":"30440220724842543ed6f45cfcefdf6d30937a2c254bbe144250b88be1e0c449a2f8119a02203a2b6ef911113b3ab9bd3777c4c641c18982a2db06a162ca1d7075f3d9e62d55","generatorPublicKey":"034ff439276ab784098e66dca4075111008448a3b3519c10701bd2d1600ec1203a","payloadHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","payloadLength":0,"reward":"0","totalFee":"0","totalAmount":"0","numberOfTransactions":0,"previousBlock":"1820562426150183839","previousBlockHex":"1943efe17e1ae39f","height":9816,"timestamp":100318240,"version":0}}}';

export const forgetLastForgedBlockError =
    '1 processes have received command forger.lastForgedBlock\n[ark-core:0:default]={"error": "Dummy error"}';

export const forgetNextForgingSlotResponse =
    '1 processes have received command forger.nextSlot\n[ark-core:0:default]={"response":{"remainingTime":6000}}';

export const forgetNextForgingSlotError =
    '1 processes have received command forger.nextSlot\n[ark-core:0:default]={"error": "Dummy error"}';
