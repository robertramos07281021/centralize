
import mongoose from "mongoose";
import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Disposition from "../../models/disposition.js";
import Production from "../../models/production.js";
import User from "../../models/user.js";
import bcrypt from "bcryptjs";
import DispoType from "../../models/dispoType.js";
import ftp from "basic-ftp"
import 'dotenv/config.js'

const productionResolver = {
  DateTime,
  Query: {
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
              "dispotype.code": {$in: ['PTP',"PAID"]}
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
                      $and: [
                        {
                          $eq: ['$ptp',true]
                        },
                        {
                          $eq: ['$dispotype.code','PAID']
                        }
                      ]
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
                      $and: [
                        {
                          $eq: ['$ptp',false]
                        },
                        {
                          $eq: ['$dispotype.code','PAID']
                        }
                      ]
                    },
                    "$amount",
                    0
                  ]
                }
              },
              ptp: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$dispotype.code','PTP']
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
              ptp: 1,
              ptp_kept: 1
            }
          }
        ])
        return disposition
      } catch (error) {
        throw new CustomError(error.message, 500)
      }
    },
    agentProduction: async(_, __, {user})=> {
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

        const dtc = await Disposition.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(user._id),
              createdAt: {$gte: yesterdayStart, $lt: todayEnd}
            },
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
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } 
          },
          {
            $group: {
              _id: null,
              dtcCurrent: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $in: ["$dispotype.code",['PTP','PAID']]
                        },
                        {
                          $gte: ['$createdAt',todayStart]
                        },
                        {
                          $lt: ['$createdAt',todayEnd]
                        }
                      ]
                    },
                    "$amount",
                    0
                  ]
                }
              },
              dtcPrevious: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $in: ["$dispotype.code",['PTP','PAID']]
                        },
                        {
                          $gte: ['$createdAt',yesterdayStart]
                        },
                        {
                          $lt: ['$createdAt',yesterDayEnd]
                        }
                      ]
                    },
                    "$amount",
                    0
                  ]
                }
              }
            }
          }
        ]).then(res => res[0] || { dtcCurrent: 0, dtcPrevious: 0 });

        return {
          dtcCurrent: dtc.dtcCurrent,
          dtcPrevious: dtc.dtcPrevious,
          ytCurrent: 0,
          ytPrevious: 0
        }
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
              'dispotype.code': {$in: ['PAID','PTP']}
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
                      $and: [
                        {
                          $eq: ['$ptp',true]
                        },
                        {
                          $eq: ['$dispotype.code','PAID']
                        }
                      ]
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
                      $and: [
                        {
                          $eq: ['$ptp',false]
                        },
                        {
                          $eq: ['$dispotype.code','PAID']
                        }
                      ]
                    },
                    "$amount",
                    0
                  ]
                }
              },
              ptp: {
                $sum: {
                  $cond: [
                    {
                      $eq: ['$dispotype.code','PTP']
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
              ptp: 1,
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
    ProductionReport: async(_,{dispositions, from, to},{user}) => {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const startFrom = new Date(from)
        startFrom.setHours(0,0,0,0)

        const endTo = new Date(to)
        endTo.setHours(23,59,59,999)

        const dispositionFilter = dispositions.length > 0 ? {$in: dispositions.map(e=> new mongoose.Types.ObjectId(e))}  :  {$ne: null}

        let objectMatch = {
          user: new mongoose.Types.ObjectId(user._id) ,
          disposition: dispositionFilter
        }

        let totalDispositionDate = {}

        if(from && to) {  
          objectMatch['createdAt'] = {$gte: startFrom, $lt: endTo}
          totalDispositionDate["$gte"] = startFrom
          totalDispositionDate["$lt"] = endTo
        } 
        
        if(from || to) {
          const startDate = new Date(from || to)
          startDate.setHours(0,0,0,0)
          
          const endDate = new Date(from || to)
          endDate.setHours(23,59,59,999)
          
          objectMatch['createdAt'] = {$gte: startDate, $lt: endDate}
          totalDispositionDate["$gte"] = startDate
          totalDispositionDate["$lt"] = endDate
        }
        
        const filterAllCreatedAt = (!from && !to) ? {$ne: null} : totalDispositionDate

        const totalDisposition = await Disposition.countDocuments({user: new mongoose.Types.ObjectId(user._id), createdAt: filterAllCreatedAt})
    
        const userDispostion = await Disposition.aggregate([
          {
            $match: objectMatch
          },
          {
            $group: {
              _id: "$disposition",
              count: {$sum :1}
            }
          },
          {
            $project: {
              _id: 0,
              dispotype: "$_id",
              count: 1
            }
          },
          {
            $sort: {
              dispotype: 1
            }
          }
        ])

        return {
          totalDisposition,
          dispotypes: userDispostion
        }
      } catch (error) {
        throw new CustomError(error.message, 500)        
      }
    },
    getAgentProductions: async(_,__,{user})=> {
      try {
        if(!user) throw new CustomError("Unauthorized",401)
        const start = new Date()
        start.setHours(0,0,0,0)

        const end = new Date()
        end.setHours(23,59,59,999)

        const production = await Production.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userInfo",
            }
          },
          {
            $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true}
          },
          {
            $match: {
              "userInfo.departments": {$in: user.departments.map(e => new mongoose.Types.ObjectId(e))},
              createdAt: { $gte: start , $lt: end }
            }
          },
          {
            $group: {
              _id: {
                _id: "$_id",
                user: "$userInfo._id",
              },
              prod_history: {$first: "$prod_history"},
              createdAt: {$first: "$createdAt"},
              target_today: {$first: "$target_today"}
            }
          },
          {
            $project: {
              _id: "$_id._id",
              user: "$_id.user",
              prod_history: 1,
              createdAt: 1,
              target_today: 1
            }
          }
        ])
        return production
      } catch (error) {
        throw new CustomError(error.message, 500)             
      }
    },
    getAgentDispositionRecords: async(_,{agentID, limit, page, from, to, search})=> {
      
      const client = new ftp.Client();
      try {
        const skip = ((page - 1) * limit)

        const dispoWithRecordings = ['UNEG','FFUP','ITP','PAID','PTP','DEC','RPCCB','RTP','ITP']

        const filtered = {
          user: new mongoose.Types.ObjectId(agentID),
          "dispotype.code" : {$in: dispoWithRecordings},
          "customer.contact_no" : {$elemMatch: { $regex: search, $options: "i" }}
        }
      
        if(from && to) { 
          const dateStart = new Date(from)
          dateStart.setHours(0,0,0,0) 
          const dateEnd = new Date(to)
          dateEnd.setHours(23,59,59,999)
          filtered['createdAt'] = {$gte: dateStart, $lt: dateEnd}
        } else if (from || to ){
          const dateStart = new Date(from || to)
          dateStart.setHours(0,0,0,0) 
          const dateEnd = new Date(from || to)
          dateEnd.setHours(23,59,59,999)
          filtered['createdAt'] = {$gte: dateStart, $lt: dateEnd}
        }

        const forFiltering = await Disposition.aggregate([
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "ca",
            }
          },
          {
            $unwind: { path: "$ca", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "customers",
              localField: "ca.customer",
              foreignField: "_id",
              as: "customer",
            }
          },
          {
            $unwind: { path: "$customer", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "buckets",
              localField: "ca.bucket",
              foreignField: "_id",
              as: "bucket",
            }
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true}
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
            $match: filtered
          },
        ])

        const months = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ]

        await client.access({
          host: process.env.FILEZILLA_HOST,
          user: process.env.FILEZILLA_USER,
          password: process.env.FILEZILLA_PASSWORD,
          port: 21,
          secure: false,
        });


        const filteredWithRecording = [];

        for (const e of forFiltering) {
          const createdAt = new Date(e.createdAt);
          const yearCreated = createdAt.getFullYear();
          const monthCreated = months[createdAt.getMonth()];
          const dayCreated = createdAt.getDate();
          const contact = e.customer.contact_no;
          const viciIpAddress = e.bucket.viciIp
          const fileNale = {
            "172.20.21.64" : "HOMECREDIT",
            "172.20.21.10" : "MIXED CAMPAIGN NEW 2",
            "172.20.21.17" : "PSBANK",
            "172.20.21.27" : "MIXED CAMPAIGN",
            "172.20.21.30" : "MCC",
            "172.20.21.35" : "MIXED CAMPAIGN",
            "172.20.21.67" : "MIXED CAMPAIGN NEW",
            '172.20.21.97' : "UB"
          }
          const year = new Date().getFullYear();
          const month = new Date().getMonth() + 1;
          const date = new Date().getDate();

          function checkDate(number) {
            return number > 9 ? number : `0${number}`;
          }

          const remoteDirVici = `/REC-${viciIpAddress}-${fileNale[viciIpAddress]}/${year}-${checkDate(month)}-${checkDate(date)}`
          const remoteDirIssabel = `/ISSABEL RECORDINGS/ISSABEL_${e.bucket.issabelIp}/${yearCreated}/${monthCreated + ' ' + yearCreated}/${dayCreated}`;
     

          const remoteDir = e.dialer === "vici" ? remoteDirVici : remoteDirIssabel

          
          const contactPatterns = contact.map(num =>
            num.length < 11 ? num : num.slice(1, 11)
          );
          let skip = false;
          
          try {
            const fileList = await client.list(remoteDir);
            const files = fileList.filter(y =>
              contactPatterns.some(pattern => y.name.includes(pattern))
            );
            if (files.length > 0) {
              filteredWithRecording.push(e._id);
            }

          } catch (err) {
            skip = true;
          } 
          if (skip) continue;
        }


        const filteredWithIds = {
          ...filtered,
          _id: { $in: filteredWithRecording }
        };
     
        const dispositions = await Disposition.aggregate([
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "ca",
            }
          },
          {
            $unwind: { path: "$ca", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "customers",
              localField: "ca.customer",
              foreignField: "_id",
              as: "customer",
            }
          },
          {
            $unwind: { path: "$customer", preserveNullAndEmptyArrays: true}
          },
          {
            $lookup: {
              from: "buckets",
              localField: "ca.bucket",
              foreignField: "_id",
              as: "bucket",
            }
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true}
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
            $match: filteredWithIds
          },
          {
            $group: {
              _id: "$_id",
              customer_name:{ $first: "$customer.fullName" },
              payment: { $first: "$payment" },
              amount: { $first: "$amount"},
              dispotype: { $first: "$dispotype.code" },
              payment_date: { $first: "$payment_date" },
              ref_no: { $first: "$ref_no" },
              comment: { $first: "$comment" },
              contact_no: {$first: '$customer.contact_no'},
              createdAt: {$first: "$createdAt"}
            }
          },
          {
            $project: {
              _id: "$_id",
              customer_name: 1 ,
              payment: 1,
              amount: 1,
              dispotype: 1,
              payment_date: 1,
              ref_no: 1,
              comment: 1,
              contact_no: 1,
              createdAt: 1
            }
          },
          { $sort: { "createdAt" : 1 } },
          { $skip: skip },
          { $limit: limit },
        ])
        
        return {
          dispositions: dispositions,
          total: filteredWithRecording?.length
        }

      } catch (error) {
        throw new CustomError(error.message, 500)  
      } finally {
        client.close()
      }
    }
  },
  DipotypeCount: {
    dispotype: async(parent)=> {
      try {
        const dispotypes = await DispoType.findById(parent.dispotype)
        return dispotypes
      } catch (error) {
        throw new CustomError(error.message, 500)        
      }
    }
  },
  Mutation: {
    resetTarget: async(_,{id,userId})=> {
      try {
        const findUser = await User.findById(userId)

        if(!findUser) {
          throw new CustomError('User not found',404)
        }

        if(id) {
          await Production.findByIdAndUpdate(id,{$set: {
            target_today: findUser.default_target
          }})
          return {
            success: true,
            message: "Target successfully updated"
          }
        } else {
          return {
            success: true,
            message: "Agent is absent"
          }
        }
        
      } catch (error) {
        throw new CustomError(error.message, 500)           
      }
    },
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
    },
    lockAgent: async(_,__,{user, pubsub, PUBSUB_EVENTS}) => {
      try {
        const startDate = new Date()
        startDate.setHours(0,0,0,0)

        const endDate = new Date()  
        endDate.setHours(23,59,59,999)

        const lockUser = await User.findByIdAndUpdate(user._id,{$set:{ isLock: true } } )

        if(!lockUser) throw new CustomError('User not found',404)

        const addproduction = await Production.findOne({$and: [{user: new mongoose.Types.ObjectId(user._id)}, {createdAt: {$gte: startDate, $lt: endDate}}]})
        
        addproduction.prod_history.push({
          type: "LOCK",
          existing: false,
          start: new Date()
        })

        await addproduction.save()

        await pubsub.publish(PUBSUB_EVENTS.AGENT_LOCK, {
          agentLocked: {
            agentId: lockUser._id,
            message: PUBSUB_EVENTS.AGENT_LOCK
          },
        });

        return {
          success: true,
          message: "Account lock"
        }
      } catch (error) {
        throw new CustomError(error.message, 500)        
      }
    }
  },

}


export default productionResolver