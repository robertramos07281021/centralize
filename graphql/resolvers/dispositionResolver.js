import { DateTime } from "../../middlewares/dateTime.js"
import CustomError from "../../middlewares/errors.js"
import Customer from "../../models/customer.js"
import CustomerAccount from "../../models/customerAccount.js"
import Disposition from "../../models/disposition.js"


const dispositionResolver = {
  DateTime,
  Query: {
    getAccountDispositions: async(_,{id}) => {
      console.log(id)
    }
  },
  Mutation: {
    createDisposition: async(_,{customerAccountId, userId, amount, payment, disposition, payment_date, payment_method,ref_no, comment}) => {
      try {
        const newDisposition = await Disposition.create({
          customer_account: customerAccountId, user:userId, amount:parseFloat(amount) || 0, payment, disposition, payment_date, payment_method, ref_no, comment
        })

        const customerAccount = await CustomerAccount.findById(customerAccountId)
        
        await Disposition.findByIdAndUpdate(customerAccount.current_disposition,
        {
          $set: {
            existing: false
          }
        })
        customerAccount.current_disposition = newDisposition._id
        await customerAccount.save()
        
        return {
          success: true,
          message: "Disposition successfully created"
        }
      } catch (error) {
        console.log(error)
        throw new CustomError(error.message, 500)
      }
    }
  },
}

export default dispositionResolver