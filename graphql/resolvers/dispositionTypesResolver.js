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
    createDispositionType: async(_,{name,code}, {user}) => {
      if(!user) throw new CustomError("Unauthorized",401)

      try {
        await DispoType.create({name,code})
        return {success: true, message: `${name}, ${code} successfully created`}
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
     }
  }
}

export default dispositionTypeResolver