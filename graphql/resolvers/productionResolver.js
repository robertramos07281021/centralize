
import CustomError from "../../middlewares/errors.js";
import Disposition from "../../models/disposition.js";
import Production from "../../models/production.js";
import User from "../../models/user.js";

const productionResolver = {

  Query: {
    getProductions: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      try {
        const res = await Production.aggregate([
          {
            $match: {
              $and: [
                {
                  createdAt :{
                    $gte: start,
                    $lt: end
                  }
                },
                {user: user._id}
              ]
            }
          }
        ])
      
        return res[0]

      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAgentProductionPerDay: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)


      const year = new Date().getFullYear()
      const month = new Date().getMonth();

      const firstDay = new Date(year,month, 1)
      const lastDay = new Date(year,month + 1,0)

      try {
        const disposition = await Disposition.aggregate([
          {
            $match: {
              user: user._id,
              createdAt: {$gte: firstDay, $lt:lastDay}
            }
          },
          {
            $group: {
              _id: {
                day: { $dayOfMonth: "$createdAt" }
              },
              total: { $sum: "$amount" }
            }
          },
          {
            $project: {
              date: "$_id.day",
              total: 1
            }
          }
        ])
        return disposition
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAgentProductionPerMonth: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      const year = new Date().getFullYear()
      const firstMonth = new Date(year, 0, 1)
      const lastMonth = new Date(year, 11, 31, 23, 59, 59, 999)
      try {
        const res = await Disposition.aggregate([
          {
            $match: {
              user: user._id,
              createdAt: { $gte: firstMonth, $lte: lastMonth }
            }
          },
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" }
              },
              total: { $sum: "$amount" }
            }
          },
          {
            $project: {
              month: "$_id.month",
              total: 1
            }
          }
        ])

        return res
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAgentTotalDispositions: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const res = await Disposition.aggregate([
          {
            $match: {
              user: user._id,
            }
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              pipeline: [
                { $project: { code: 1}}
              ],
              as: "dispotype",
            }
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true}
          },
          {
            $group: {
              _id: "$dispotype._id",
              dispotype: {$first: "$dispotype.code" },
              count: {$sum: 1}
            }
          },
          {
            $project: {
              _id: "$_id",
              dispotype: 1,
              count: 1
            }
          }
        ])  

        return res
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
  Production: {
    dispositions: async(parent) => {
      try {
        const disposition = await Disposition.aggregate([
          {
            $match: {
              _id: {$in: parent.dispositions}
            }
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              pipeline: [
                { $project: { code: 1}}
              ],
              as: "dispotype",
            }
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true}
          },
          {
            $group: {
              _id: "$dispotype._id",
              collection: {$sum: "$amount"},
              dispotype: {$first: "$dispotype.code" },
              count: {$sum: 1}
            }
          },
          {
            $project: {
              _id: "$_id",
              collection: 1,
              dispotype: 1,
              count: 1
            }
          }
        ])
        return disposition
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    user: async(parent) => {
      try {
        const findUser = await User.findById(parent.user)
        if(!findUser) throw new CustomError("User not found", 404)
        return findUser
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
  Mutation: {
    updateProduction: async(_,{type},{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        
        const end = new Date();
        end.setHours(23, 59, 59, 999);
  

        const updateProduction = await Production.findOne({$and: [
          {
            user: user._id
          },
          {
            createdAt: {$gte: start, $lt: end}
          }
        ]
        })
        if(!updateProduction) throw new CustomError("Production not found")

        updateProduction.account_history.push({
          type,
          time: new Date()
        })

        await updateProduction.save()

        return {
          success: true,
          message: "Successfully Updated"
        }

      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  }
}


export default productionResolver