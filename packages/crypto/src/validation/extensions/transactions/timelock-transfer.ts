import { TRANSACTION_TYPES } from "../../../constants"
import transaction from "./base"

export default joi => ({
  name: "arkTimelockTransfer",
  base: transaction(joi).append({
    type: joi
      .number()
      .only(TRANSACTION_TYPES.MULTI_PAYMENT)
      .required(),
    amount: joi
      .alternatives()
      .try(joi.bignumber().only(0), joi.number().only(0))
      .optional(),
    asset: joi.object().required(),
    recipientId: joi.empty()
  })
});
