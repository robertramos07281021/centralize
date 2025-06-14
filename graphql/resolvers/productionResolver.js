
import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Disposition from "../../models/disposition.js";
import Production from "../../models/production.js";
import User from "../../models/user.js";
import bcrypt from "bcryptjs";

const productionResolver = {
  DateTime,
  Query: {
    getProductions: async(_,__,{user}) => {
      if(!user) throw new CustomError("Unauthorized",401)
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      try {
        const res = await Disposition.aggregate([
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
          },
         {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
              pipeline: [
                {$project: {name: 1, code: 1, _id: 1}}
              ]
            }
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } 
          },
          {
            $group: {
              _id: "$dispotype._id",
              count: {$sum: 1}
            }
          },
          {
            $project: {
              _id: "$_id",
              count: 1
            }
          },
        ])

        return res
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAgentProductionPerDay: async(_,__,{user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)

        
        const year = new Date().getFullYear()
        const month = new Date().getMonth();

        const firstDay = new Date(year,month, 1)
        const lastDay = new Date(year,month + 1,0)

        const disposition = await Disposition.aggregate([
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            }
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } 
          },
          {
            $match: {
              user: user._id,
              createdAt: {$gte: firstDay, $lt:lastDay},
              "dispotype.code": {$eq: "PAID"}
            }
          },
          {
            $group: {
              _id: {
                day: { $dayOfMonth: "$createdAt" }
              },
              calls: {
                $sum: {
                  $cond: [{$eq: ["$contact_method","calls"]} ,"$amount",0]
                }
              },
              sms: {
                $sum: {
                  $cond: [{$eq: ["$contact_method","sms"]} ,"$amount",0]
                }
              },
              email: {
                $sum: {
                  $cond: [{$eq: ["$contact_method","email"]} ,"$amount",0]
                }
              },
              skip: {
                $sum: {
                  $cond: [{$eq: ["$contact_method","skip"]} ,"$amount",0]
                }
              },
              field: {
                $sum: {
                  $cond: [{$eq: ["$contact_method","field"]} ,"$amount",0]
                }
              },
              total: {
                $sum: "$amount"
              },
              ptp_kept: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$ptp',true]
                    },
                    "$amount",
                    0
                  ]
                }
              },
              paid: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$ptp',false]
                    },
                    "$amount",
                    0
                  ]
                }
              }
            }
          },
          {
            $project: {
              date: "$_id.day",
              calls: 1,
              skip: 1,
              email: 1,
              sms: 1,
              field: 1,
              total: 1,
              paid: 1,
              ptp_kept: 1
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
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            }
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } 
          },
          {
            $match: {
              user: user._id,
              createdAt: { $gte: firstMonth, $lte: lastMonth },
              'dispotype.code': {$eq: 'PAID'}
            }
          },
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" }
              },
              calls: {
                $sum: {
                  $cond: [{$eq: ["$contact_method","calls"]} ,"$amount",0]
                }
              },
              sms: {
                $sum: {
                  $cond: [{$eq: ["$contact_method","sms"]} ,"$amount",0]
                }
              },
              email: {
                $sum: {
                  $cond: [{$eq: ["$contact_method","email"]} ,"$amount",0]
                }
              },
              skip: {
                $sum: {
                  $cond: [{$eq: ["$contact_method","skip"]} ,"$amount",0]
                }
              },
              field: {
                $sum: {
                  $cond: [{$eq: ["$contact_method","field"]} ,"$amount",0]
                }
              },
              total: {
                $sum: "$amount"
              },
              ptp_kept: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$ptp',true]
                    },
                    "$amount",
                    0
                  ]
                }
              },
              paid: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$ptp',false]
                    },
                    "$amount",
                    0
                  ]
                }
              }
            }
          },
          {
            $project: {
              month: "$_id.month",
              calls: 1,
              skip: 1,
              email: 1,
              sms: 1,
              field: 1,
              total: 1,
              paid: 1,
              ptp_kept: 1
            }
          }
        ])

        return res
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAgentTotalDispositions: async(_,__,{user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const year = new Date().getFullYear()
        const month = new Date().getMonth();
        const firstDay = new Date(year,month, 1)
        const lastDay = new Date(year,month + 1,0)

        const res = await Disposition.aggregate([
          {
            $match: {
              user: user._id,
              createdAt: { $gte: firstDay, $lt: lastDay }
            }
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            }
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true}
          },
          {
            $group: {
              _id: "$dispotype._id",
              count: {$sum: 1}
            }
          },
          {
            $project: {
              _id:null,
              dispotype: "$_id",
              count: 1
            }
          }
        ])  

        return res
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    getAgentDailyCollection: async(_,__,{user})=> {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const yesterdayStart = new Date();
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterDayEnd = new Date();
        yesterDayEnd.setDate(yesterDayEnd.getDate() - 1 )
        yesterDayEnd.setHours(23, 59, 59, 999);

        const agentCollection = await Disposition.aggregate([
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            }
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true}
          },
          {
            $match: {
              createdAt: {$gte: yesterdayStart, $lt: todayEnd},
              user: {$eq: user._id},
              "dispotype.code": {$in: ['PAID','PTP']}
            }
          },
          {
            $project: {
              amount: 1,
              createdAt: 1,
              ptp: 1,
              code: "$dispotype.code",
              isToday: {
                $and: [{ $gte: ["$createdAt", todayStart] }, { $lt: ["$createdAt", todayEnd] }]
              },
              isYesterday: {
                $and: [{ $gte: ["$createdAt", yesterdayStart] }, { $lt: ["$createdAt", yesterDayEnd] }]
              }
            }
          },
          {
            $group: {
              _id: null,
              ptp_amount: {
                $sum: {
                  $cond: [
                    { 
                      $and: ["$isToday", { $eq: ["$code", "PTP"] }] 
                    }, 
                    "$amount",
                    0
                  ]
                }
              },
              ptp_yesterday:{
                $sum: {
                  $cond: [
                    { 
                      $and: ["$isYesterday", { $eq: ["$code", "PTP"] }] 
                    }, 
                    "$amount",
                    0
                  ]
                }
              },
              ptp_kept_amount: {
                $sum: {
                  $cond: [
                    { 
                      $and: ["$isToday", { $eq: ["$code", "PAID"] }, {$eq: ['$ptp', true]}] 
                    }, 
                    "$amount",
                    0
                  ]
                }
              },
              ptp_kept_yesterday: {
                $sum: {
                  $cond: [
                    { 
                      $and: ["$isYesterday", { $eq: ["$code", "PAID"] }, { $eq: ['$ptp', true] }] 
                    }, 
                    "$amount",
                    0
                  ]
                }
              },
              paid_amount: {
                $sum: {
                  $cond: [
                    { 
                      $and: ["$isToday", { $eq: ["$code", "PAID"] }, { $eq: ['$ptp', false] }] 
                    }, 
                    "$amount",
                    0
                  ]
                }
              },
              paid_yesterday: {
                $sum: {
                  $cond: [
                    { 
                      $and: ["$isYesterday", { $eq: ["$code", "PAID"] }, { $eq: ['$ptp', false] }] 
                    }, 
                    "$amount",
                    0
                  ]
                }
              },
            }
          },
          {
            $project: {
              _id: 0,
              ptp_amount: 1,
              ptp_yesterday: 1,
              ptp_kept_amount: 1,
              ptp_kept_yesterday: 1,
              paid_amount: 1,
              paid_yesterday: 1
            }
          }
        ])

        return agentCollection[0]
      } catch (error) {
        throw new CustomError(error.message, 500)        
      }
    },
    getProductionStatus: async(_,__,{user})=> {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const findProd = await Production.findOne({$and: [{user:user._id},{createdAt: {$gte: todayStart, $lt: todayEnd}}]})

        console.log(findProd)

        return 'hello'
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    }
  },
  Mutation: {
    updateProduction: async(_,{type},{user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)

        const start = new Date();
        start.setHours(0, 0, 0, 0);
        
        const end = new Date();
        end.setHours(23, 59, 59, 999);
  
        const updateProduction = await Production.findOne({
          $and: [
            {
              user: user._id
            },
            {
              createdAt: {$gte: start, $lt: end}
            }
          ]
        })

        if(!updateProduction) {
          throw new CustomError("Production not found")
        }

        updateProduction.prod_history = updateProduction.prod_history.map((entry) => {
          if (entry.existing === true) {
            return {
              ...entry,
              existing: false,
              end: new Date(),
            };
          }
          return entry;
        });
        
        const newStart = new Date()
        


        updateProduction.prod_history.push({
          type,
          start: newStart,
          existing: true,
        })

        await updateProduction.save()

        return {
          success: true,
          message: "Production successfully updated",
          start: newStart
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    loginToProd: async(_,{password},{user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const findUser = await User.findById(user._id)

        const validatePassword = await bcrypt.compare(password, user.password)
        if(!validatePassword) throw new CustomError('Incorrect')

        return {
          success: validatePassword,
          message: 'Successfully login'
        }
      } catch (error) {
        throw new CustomError(error.message, 500)
      }  
    }
  }
}


export default productionResolver