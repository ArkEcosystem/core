import { TRANSACTION_TYPES } from "../../../constants"
import transaction from "./base"

export default joi => ({
  name: "arkMultiPayment",
  base: transaction(joi).append({
    type: joi
      .number()
      .only(TRANSACTION_TYPES.MULTI_PAYMENT)
      .required(),
    asset: joi.object().required(),
    recipientId: joi.empty()
  })
});
