import CustomError from "../../middlewares/errors.js"
import DispoType from "../../models/dispoType.js"


const dispositionTypeResolver = {

  Query: {
    getDispositionTypes: async() => {
      try {
        const dipositionTypes = await DispoType.find() 
        return dipositionTypes
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
  },
  Mutation: {
    createDispositionType: async(_,{input}, {user}) => {
      try {

        if(!user) throw new CustomError("Unauthorized",401)
        const skipper = input.contact_method.includes('skipper')
        const field = input.contact_method.includes('field')
        const caller = input.contact_method.includes('caller')
        console.log(input.contact_method)

        const newDispotype  = await DispoType.create({...input, "contact_method.skipper": skipper, "contact_method.field": field, "contact_method.caller": caller })
        return {success: true, message: `${newDispotype.name} has been created`}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
     },
     updateDispositionType: async(_,{id, input}) => {
      try {
        const skipper = input.contact_method.includes('skipper')
        const field = input.contact_method.includes('field')
        const caller = input.contact_method.includes('caller')



        const findDispoType = await DispoType.findByIdAndUpdate(id,{
          $set: {
            ...input,
            "contact_methods.skipper": skipper, 
            "contact_methods.field": field, 
            "contact_methods.caller": caller 
          }
        })
        return {success: true, message: `${findDispoType.name.toUpperCase()} successfully updated`}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
     }
  }
}

export default dispositionTypeResolver