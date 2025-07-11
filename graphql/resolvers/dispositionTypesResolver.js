import CustomError from "../../middlewares/errors.js"
import DispoType from "../../models/dispoType.js"


const dispositionTypeResolver = {

  Query: {
    getDispositionTypes: async() => {
      try {
        const dipositionTypes = await DispoType.find({active: {$ne: false}}) 
        return dipositionTypes
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getDispositionTypesAll: async() => {
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
        const skipper = input.contact_method.toString().includes('skipper')
        const field = input.contact_method.toString().includes('field')
        const caller = input.contact_method.toString().includes('caller')

        const contactMethod = {
          skipper,
          field,
          caller
        };

        const newDispotype  = await DispoType.create({...input, contact_methods: contactMethod })

        return {success: true, message: `${newDispotype.name} has been created`}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
     updateDispositionType: async(_,{id, input},{user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const { contact_method, ...restInput } = input

        const skipper = contact_method.toString().includes('skipper')
        const field = contact_method.toString().includes('field')
        const caller = contact_method.toString().includes('caller')

        const contact_methods = { skipper, field, caller };

        const findDispoType = await DispoType.findByIdAndUpdate(id,{
          $set: {
            ...restInput,
            contact_methods: contact_methods
          }
        },{ new: true })

        return {success: true, message: `${findDispoType.name.toUpperCase()} successfully updated`}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
     },
     activateDeactivateDispotype: async(_,{id},{user})=> {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        
        const dispotype = await DispoType.findById(id)

        if(!dispotype) throw new CustomError('Dispotype not found',404)

        dispotype.active = !dispotype.active
        await dispotype.save()

        return {
          success: true,
          message: `Dispotype successfully ${dispotype.active ? "activate" : "deactivate"}`,
        };
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
     }
  }
}

export default dispositionTypeResolver