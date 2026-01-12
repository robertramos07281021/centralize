import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Bucket from "../../models/bucket.js";
import Customer from "../../models/customer.js";
import CustomerAccount from "../../models/customerAccount.js";
import DispoType from "../../models/dispoType.js";
import Group from "../../models/group.js";
import ModifyRecord from "../../models/modifyRecord.js";
import mongoose from "mongoose";
import User from "../../models/user.js";
import Department from "../../models/department.js";
import Callfile from "../../models/callfile.js";
import Disposition from "../../models/disposition.js";

const customerResolver = {
  DateTime,
  Query: {
    getModifyReport: async (_, { id }) => {
      try {
        return await ModifyRecord.find({ user: id });
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    findCustomer: async (_, { fullName, dob, email, contact_no }) => {
      try {
        const searchQuery = await Customer.aggregate([
          {
            $match: {
              fullName: { $regex: fullName, $options: "i" },
              dob: { $regex: dob, $options: "i" },
              email: { $elemMatch: { $regex: email, $options: "i" } },
              contact_no: { $elemMatch: { $regex: contact_no, $options: "i" } },
            },
          },
        ]);
        return searchQuery;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    getCustomers: async (_, { page }) => {
      try {
        const customers = await Customer.aggregate([
          {
            $facet: {
              customers: [{ $skip: (page - 1) * 20 }, { $limit: 20 }],
              total: [{ $count: "totalCustomers" }],
            },
          },
        ]);
        return {
          customers: customers[0].customers ?? [],
          total:
            customers[0].total.length > 0
              ? customers[0].total[0].totalCustomers
              : 0,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    search: async (_, { search }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        if (!search) {
          return [];
        }

        const searchValue = search;

        const startOfTheDay = new Date();
        startOfTheDay.setHours(0, 0, 0, 0);
        const endOfTheDay = new Date();
        endOfTheDay.setHours(23, 59, 59, 999);
        const success = [
          "PTP",
          "UNEG",
          "FFUP",
          "KOR",
          "NOA",
          "FV",
          "HUP",
          "LM",
          "ANSM",
          "DEC",
          "RTP",
          "ITP",
          "PAID",
        ];

        const callfiles = (
          await Callfile.find({
            active: true,
            bucket: {
              $in: user.buckets.map((x) => new mongoose.Types.ObjectId(x)),
            },
          })
        ).map((x) => x._id);
 
        const accounts = await Customer.aggregate([
          {
            $match: {
              $text: { $search: `"${searchValue}"` },
              callfile: { $in: callfiles },
            },
          },
          {
            $limit: 50,
          },
          {
            $lookup: {
              from: "customeraccounts",
              let: { cus_account: "$customer_account" },
              pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$cus_account"] } } },
                {
                  $lookup: {
                    from: "callfiles",
                    let: { callfileId: "$callfile" },
                    pipeline: [
                      { $match: { $expr: { $eq: ["$_id", "$$callfileId"] } } },
                      { $match: { active: true } },
                      {
                        $match: {
                          bucket: {
                            $in: user.buckets.map(
                              (x) => new mongoose.Types.ObjectId(x)
                            ),
                          },
                        },
                      },
                    ],
                    as: "account_callfile",
                  },
                },
                {
                  $unwind: {
                    path: "$account_callfile",
                    preserveNullAndEmptyArrays: false,
                  },
                },
              ],
              as: "ca",
            },
          },
          {
            $unwind: {
              path: "$ca",
              preserveNullAndEmptyArrays: false,
            },
          },

          {
            $lookup: {
              from: "users",
              localField: "ca.on_hands",
              foreignField: "_id",
              as: "on_hands_user",
            },
          },
          {
            $unwind: {
              path: "$on_hands_user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $expr: {
                $ne: ["$on_hands_user.handsOn", "$ca._id"],
              },
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "ca.bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          {
            $unwind: {
              path: "$account_bucket",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $lookup: {
              from: "dispositions",
              localField: "ca.current_disposition",
              foreignField: "_id",
              as: "cd",
            },
          },
          { $unwind: { path: "$cd", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "dispotypes",
              localField: "cd.disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          { $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "users",
              localField: "cd.user",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "dispositions",
              localField: "ca.history",
              foreignField: "_id",
              as: "dispo_history",
            },
          },
          {
            $addFields: {
              isRPCToday: {
                $cond: {
                  if: {
                    $and: [
                      { $in: ["$dispotype.code", success] },
                      { $gte: ["$cd.createdAt", startOfTheDay] },
                      { $lte: ["$cd.createdAt", endOfTheDay] },
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              _id: "$ca._id",
              customer_info: {
                fullName: "$fullName",
                dob: "$dob",
                gender: "$gender",
                contact_no: "$contact_no",
                emails: "$emails",
                addresses: "$addresses",
                isRPC: "$isRPC",
                _id: "$_id",
              },
              case_id: "$ca.case_id",
              account_id: "$ca.account_id",
              endorsement_date: "$ca.endorsement_date",
              credit_customer_id: "$ca.credit_customer_id",
              bill_due_date: "$ca.bill_due_date",
              max_dpd: "$ca.max_dpd",
              dpd: "$ca.dpd",
              batch_no: "$ca.batch_no",
              account_update_history: "$ca.account_update_history",
              month_pd: "$ca.month_pd",
              balance: "$ca.balance",
              partial_payment_w_service_fee:
                "$ca.out_standing_details.partial_payment_w_service_fee",
              new_tad_with_sf: "$ca.out_standing_details.new_tad_with_sf",
              new_pay_off: "$ca.out_standing_details.new_pay_off",
              service_fee: "$ca.out_standing_details.service_fee",
              paid_amount: "$ca.paid_amount",
              isRPCToday: 1,
              assigned: "$ca.assigned",
              assigned_date: "$ca.assigned_date",
              dispo_history: 1,
              current_disposition: "$cd",
              out_standing_details: "$ca.out_standing_details",
              grass_details: "$ca.grass_details",
              account_bucket: "$account_bucket",
              emergency_contact: "$ca.emergency_contact",
              year: "$ca.out_standing_details.year",
              nodel: "$ca.out_standing_details.model",
              brand: "$ca.out_standing_details.brand",
              last_payment_amount:
                "$ca.out_standing_details.last_payment_amount",
              last_payment_date: "$ca.out_standing_details.last_payment_date",
              rem_months: "$ca.out_standing_details.rem_months",
              product: "$ca.out_standing_details.product",
              paid: "$ca.out_standing_details.paid",
              term: "$ca.out_standing_details.term",
            },
          },
        ]);

        return accounts;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getMonthlyPerformance: async (_, __, { user }) => {
      try {
        const year = new Date().getFullYear();
        const month = new Date().getMonth();
        const thisDay = new Date();
        thisDay.setHours(0, 0, 0, 0);
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const aomCampaign = await Department.find({ aom: user._id }).lean();
        const aomCampaignNameArray = aomCampaign.map((e) => e.name);
        const campaignBucket = await Bucket.find({
          dept: { $in: aomCampaignNameArray },
        }).lean();
        const newArrayCampaignBucket = campaignBucket.map((e) => e._id);

        const dispositionCheck = await Disposition.aggregate([
          {
            $match: {
              createdAt: { $gte: firstDay, $lt: lastDay },
            },
          },
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "ca",
            },
          },
          {
            $unwind: { path: "$ca", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "ca.bucket",
              foreignField: "_id",
              as: "bucket",
            },
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "bucket.dept": { $in: aomCampaignNameArray },
            },
          },
          {
            $group: {
              _id: {
                campaign: "$bucket.dept",
                day: { $dayOfMonth: "$createdAt" },
                month: { $month: "$createdAt" },
                year: { $year: "$createdAt" },
              },
              users: {
                $addToSet: "$user",
              },
            },
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id.campaign",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
              users: { $size: "$users" },
            },
          },
        ]);

        const dispo = await Promise.all(
          dispositionCheck.map(async (e) => {
            const users = await User.aggregate([
              {
                $match: {
                  type: "AGENT",
                },
              },
              {
                $lookup: {
                  from: "departments",
                  localField: "departments",
                  foreignField: "_id",
                  as: "department",
                },
              },
              {
                $unwind: {
                  path: "$department",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $match: {
                  "department.name": e.campaign,
                },
              },
            ]);
            return {
              campaign: e.campaign,
              rate: users.length === 0 ? 0 : (e.users / users.length) * 100,
            };
          })
        );

        const connectedDispo = [
          "FFUP",
          "PAID",
          "PRC",
          "RPCCB",
          "FV",
          "LM",
          "PTP",
          "UNEG",
          "DEC",
          "ITP",
          "RTP",
        ];

        const accounts = await CustomerAccount.aggregate([
          {
            $match: {
              createdAt: { $gte: firstDay, $lt: lastDay },
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          {
            $unwind: {
              path: "$account_bucket",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "account_bucket._id": { $in: newArrayCampaignBucket },
            },
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "currentDisposition",
            },
          },
          {
            $unwind: {
              path: "$currentDisposition",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "currentDisposition.disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $group: {
              _id: "$account_bucket.dept",
              totalAccounts: {
                $sum: 1,
              },
              connectedAccounts: {
                $sum: {
                  $cond: [
                    {
                      $in: ["$dispotype.code", connectedDispo],
                    },
                    1,
                    0,
                  ],
                },
              },
              targetAmount: {
                $sum: "$out_standing_details.total_os",
              },
              collectedAmount: {
                $sum: "$paid_amount",
              },

              ptpKeptAccount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$dispotype.code", "PAID"],
                        },
                        {
                          $eq: ["$dispotype.ptp", true],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              paidAccount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$dispotype.code", "PAID"],
                        },
                        {
                          $eq: ["$currentDisposition.ptp", false],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              totalAccounts: 1,
              connectedAccounts: 1,
              targetAmount: 1,
              collectedAmount: 1,
              ptpKeptAccount: 1,
              paidAccount: 1,
            },
          },
        ]);

        const newResult = accounts.map((com) => {
          const findDept = aomCampaign.find((e) => e.name === com.campaign);
          const camp = dispo
            .filter((x) => x.campaign === com.campaign)
            .map((y) => y.rate);
          const sumOfCamp =
            camp.length > 0
              ? camp.reduce((t, v) => {
                  return t + v;
                })
              : 0;

          return {
            ...com,
            campaign: findDept ? findDept._id.toString() : com.campaign,
            attendanceRate: camp.length > 0 ? sumOfCamp / camp.length : 0,
          };
        });

        return newResult;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    findCustomerAccount: async (_, { query }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const {
          disposition,
          groupId,
          page,
          assigned,
          limit,
          selectedBucket,
          dpd,
          searchName,
        } = query;

        let selected = "";
        if (groupId) {
          const [group, userSelected] = await Promise.all([
            Group.findById(groupId).lean(),
            User.findById(groupId).lean(),
          ]);

          selected = group?._id || userSelected?._id || null;
        }
        const activeCallfile = await Callfile.findOne({
          bucket: new mongoose.Types.ObjectId(selectedBucket),
          active: { $eq: true },
        });

        if (!activeCallfile) return null;

        const search = [
          { "existingDispo.code": { $ne: "DNC" } },
          { balance: { $ne: 0 } },
        ];

        if (dpd) {
          search.push({ max_dpd: { $eq: dpd } });
        }

        if (disposition && disposition.length > 0) {
          search.push({ "dispotype.code": { $in: disposition } });
        }

        if (assigned === "assigned") {
          if (selected) {
            search.push({ assigned: new mongoose.Types.ObjectId(selected) });
          } else {
            search.push({ assigned: { $ne: null } });
          }
        } else {
          search.push({ assigned: null });
        }

        const customerLookupPipeline = [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$customerId"] },
            },
          },
        ];

        if (searchName) {
          customerLookupPipeline.push({
            $match: {
              fullName: { $regex: searchName, $options: "i" },
            },
          });
        }

        const accounts = await CustomerAccount.aggregate([
          {
            $match: {
              callfile: activeCallfile?._id,
            },
          },
          {
            $lookup: {
              from: "customers",
              let: { customerId: "$customer" },
              pipeline: customerLookupPipeline,
              as: "customer_info",
            },
          },
          { $unwind: "$customer_info" },
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer_info",
            },
          },
          {
            $unwind: {
              path: "$customer_info",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          {
            $unwind: {
              path: "$account_bucket",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "cd",
            },
          },
          {
            $unwind: {
              path: "$ca_disposition",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "cd.disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },

          {
            $match: {
              $and: search,
            },
          },
          {
            $project: {
              _id: "$_id",
              customer_info: "$customer_info",
              dispoType: "$dispotype",
              account_bucket: "$account_bucket",
              max_dpd: "$max_dpd",
              assigned: "$assigned",
            },
          },
          {
            $facet: {
              FindCustomerAccount: [
                { $skip: (page - 1) * limit },
                { $limit: limit },
              ],
              AllCustomerAccounts: [
                {
                  $group: {
                    _id: null,
                    ids: { $push: "$_id" },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    ids: 1,
                  },
                },
              ],
            },
          },
        ]);

        const allAccounts = accounts[0]?.AllCustomerAccounts[0]?.ids || [];

        return {
          CustomerAccounts: accounts[0]?.FindCustomerAccount || [],
          totalCountCustomerAccounts: allAccounts,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    accountsCount: async (_, __, { user }) => {
      try {
        const aomDept = (await Department.find({ aom: user._id }).lean()).map(
          (dept) => dept.name
        );

        const deptBuckets = (
          await Bucket.find({ dept: { $in: aomDept } }).lean()
        ).map((e) => e._id);

        return (
          (await CustomerAccount.countDocuments({
            bucket: { $in: deptBuckets },
          })) || 0
        );
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getMonthlyTarget: async (_, __, { user }) => {
      try {
        const [aomCampaign, dispoType] = await Promise.all([
          Department.find({ aom: user._id }).lean(),
          DispoType.find().lean(),
        ]);

        const aomCampaignNameArray = aomCampaign.map((e) => e.name);
        const campaignBucket = await Bucket.find({
          dept: { $in: aomCampaignNameArray },
        }).lean();
        const newArrayCampaignBucket = campaignBucket.map(
          (e) => new mongoose.Types.ObjectId(e._id)
        );
        const { _id } = dispoType.find((x) => x.code === "PAID");
        const ptp = dispoType.find((x) => x.code === "PTP");

        const findActiveCallfile = await Callfile.find({
          $and: [
            {
              bucket: { $in: newArrayCampaignBucket },
            },
            {
              active: { $eq: true },
            },
          ],
        }).lean();

        const newMapCallfile = findActiveCallfile.map(
          (x) => new mongoose.Types.ObjectId(x._id)
        );

        const monthlyTarget = await CustomerAccount.aggregate([
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          {
            $unwind: {
              path: "$account_bucket",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "currentDisposition",
            },
          },
          {
            $unwind: {
              path: "$currentDisposition",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "currentDisposition.disposition",
              foreignField: "_id",
              as: "dispoType",
            },
          },
          {
            $unwind: { path: "$dispoType", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "history",
              foreignField: "_id",
              as: "account_history",
            },
          },
          {
            $match: {
              callfile: { $in: newMapCallfile },
            },
          },
          {
            $addFields: {
              historyPTPKept: {
                $filter: {
                  input: "$account_history",
                  as: "h",
                  cond: {
                    $and: [
                      {
                        $eq: [
                          "$$h.disposition",
                          new mongoose.Types.ObjectId(_id),
                        ],
                      },
                      { $eq: ["$$h.ptp", true] },
                      { $eq: ["$$h.exists", true] },
                    ],
                  },
                },
              },
              historyPaidOnly: {
                $filter: {
                  input: "$account_history",
                  as: "h",
                  cond: {
                    $and: [
                      {
                        $eq: [
                          "$$h.disposition",
                          new mongoose.Types.ObjectId(_id),
                        ],
                      },
                      { $eq: ["$$h.ptp", false] },
                    ],
                  },
                },
              },
              hasPTP: {
                $anyElementTrue: {
                  $map: {
                    input: "$account_history",
                    as: "h",
                    in: {
                      $and: [
                        { $eq: ["$$h.ptp", true] },
                        {
                          $eq: [
                            "$$h.disposition",
                            new mongoose.Types.ObjectId(ptp._id),
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          {
            $addFields: {
              ptpKeptHistoryCount: { $size: "$historyPTPKept" },
              ptpKeptAmount: {
                $sum: {
                  $map: {
                    input: "$historyPTPKept",
                    as: "item",
                    in: "$$item.amount",
                  },
                },
              },
              paidHistoryCount: { $size: "$historyPaidOnly" },
              paidHistoryAmount: {
                $sum: {
                  $map: {
                    input: "$historyPaidOnly",
                    as: "item",
                    in: "$$item.amount",
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: "$account_bucket.dept",
              ptpCount: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$dispoType.code", "PTP"],
                    },
                    1,
                    0,
                  ],
                },
              },
              pkCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$dispoType.code", "PAID"],
                        },
                        {
                          $eq: ["$currentDisposition.ptp", true],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              pCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$dispoType.code", "PAID"],
                        },
                        {
                          $eq: ["$currentDisposition.ptp", false],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              ptp: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$dispoType.code", "PTP"],
                    },
                    "$currentDisposition.amount",
                    0,
                  ],
                },
              },
              pk: { $sum: "$ptpKeptAmount" },
              paid: { $sum: "$paidHistoryAmount" },
              collected: { $sum: "$paid_amount" },
              target: { $sum: "$out_standing_details.total_os" },
              isPTP: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$hasPTP", true],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              pk: 1,
              paid: 1,
              ptp: 1,
              isPTP: 1,
              ptpCount: 1,
              pkCount: 1,
              pCount: 1,
              collected: 1,
              target: 1,
              isPTP: 1,
            },
          },
        ]);

        const newMonthlyTarget = monthlyTarget.map((e) => {
          const campagin = aomCampaign.find((ac) => e.campaign === ac.name);
          return {
            ...e,
            campaign: campagin ? campagin._id : null,
          };
        });

        return newMonthlyTarget;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    customerOtherAccounts: async (_, { caId }) => {
      try {
     
        if (!caId) return null;
        const findCustomerAccount = await CustomerAccount.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(caId),
            },
          },
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "ac",
            },
          },
          {
            $unwind: { path: "$ac", preserveNullAndEmptyArrays: true },
          },
        ]);

        const { callfile, ac, _id } = findCustomerAccount[0];

        const otherCustomer = await CustomerAccount.aggregate([
          {
            $match: {
              callfile: callfile,
              _id: { $ne: _id },
            },
          },
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer_info",
            },
          },
          {
            $unwind: {
              path: "$customer_info",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          {
            $unwind: {
              path: "$account_bucket",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "customer_info.platform_customer_id": {
                $eq: ac.platform_customer_id,
              },
            },
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "history",
              foreignField: "_id",
              as: "dispo_history",
            },
          },
        ]);

        return otherCustomer;
      } catch (error) {
        console.log(error)
        throw new CustomError(error.message, 500);
      }
    },
    masterFileAccounts: async (
      _,
      { bucketIds, page = 1, limit = 200, search },
      { user }
    ) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const requestedBucketIds = Array.isArray(bucketIds) ? bucketIds : [];
        const userBucketIds = (user?.buckets ?? []).map((id) => String(id));

        const allowed = requestedBucketIds.length
          ? requestedBucketIds.filter((id) => userBucketIds.includes(String(id)))
          : userBucketIds;

        if (allowed.length === 0) {
          return { accounts: [], total: 0 };
        }

        const allowedBucketObjectIds = allowed.map(
          (id) => new mongoose.Types.ObjectId(id)
        );

        const activeCallfiles = await Callfile.find({
          active: true,
          bucket: { $in: allowedBucketObjectIds },
        })
          .select({ _id: 1 })
          .lean();

        const callfileIds = activeCallfiles.map((c) => c._id);

        if (callfileIds.length === 0) {
          return { accounts: [], total: 0 };
        }

        const safePage = Number.isFinite(page) && page > 0 ? page : 1;
        const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 200;
        const skip = (safePage - 1) * safeLimit;

        const pipeline = [
          {
            $match: {
              callfile: { $in: callfileIds },
            },
          },
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer_info",
            },
          },
          {
            $unwind: {
              path: "$customer_info",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          {
            $unwind: {
              path: "$account_bucket",
              preserveNullAndEmptyArrays: true,
            },
          },
        ];

        if (search && String(search).trim()) {
          const s = String(search).trim();
          pipeline.push({
            $match: {
              $or: [
                { "customer_info.fullName": { $regex: s, $options: "i" } },
                { "account_bucket.name": { $regex: s, $options: "i" } },
                { "account_bucket.dept": { $regex: s, $options: "i" } },
                { "customer_info.gender": { $regex: s, $options: "i" } },
                {
                  "customer_info.contact_no": {
                    $elemMatch: { $regex: s, $options: "i" },
                  },
                },
                { case_id: { $regex: s, $options: "i" } },
                { account_id: { $regex: s, $options: "i" } },
              ],
            },
          });
        }

        pipeline.push(
          {
            $project: {
              _id: 1,
              case_id: 1,
              account_id: 1,
              endorsement_date: 1,
              credit_customer_id: 1,
              bill_due_date: 1,
              client_type: 1,
              overdue_balance: 1,
              client_id: 1,
              due_date: 1,
              loan_start: 1,
              max_dpd: 1,
              balance: 1,
              month_pd: 1,
              dpd: 1,
              paid_amount: 1,
              batch_no: 1,
              out_standing_details: 1,
              account_update_history: 1,
              grass_details: 1,
              account_bucket: "$account_bucket",
              customer_info: "$customer_info",
              emergency_contact: 1,
              assigned: 1,
              assigned_date: 1,
              current_disposition: 1,
              dispo_history: 1,
            },
          },
          {
            $facet: {
              accounts: [{ $skip: skip }, { $limit: safeLimit }],
              total: [{ $count: "count" }],
            },
          },
          {
            $project: {
              accounts: 1,
              total: {
                $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0],
              },
            },
          }
        );

        const result = await CustomerAccount.aggregate(pipeline);
        const first = result?.[0] ?? { accounts: [], total: 0 };
        return first;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    masterFileAccountsByCallfile: async (
      _,
      { callfileIds, page = 1, limit = 200, search },
      { user }
    ) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const requestedCallfileIds = Array.isArray(callfileIds)
          ? callfileIds
          : [];
        if (requestedCallfileIds.length === 0) {
          return { accounts: [], total: 0 };
        }

        const userBucketIds = (user?.buckets ?? [])
          .map((id) => String(id))
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        if (userBucketIds.length === 0) return { accounts: [], total: 0 };

        const requestedObjectIds = requestedCallfileIds
          .map((id) => String(id))
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        if (requestedObjectIds.length === 0) return { accounts: [], total: 0 };

        const allowedCallfiles = await Callfile.find({
          _id: { $in: requestedObjectIds },
          active: true,
          bucket: { $in: userBucketIds },
        })
          .select({ _id: 1 })
          .lean();

        const allowedCallfileIds = allowedCallfiles.map((c) => c._id);
        if (allowedCallfileIds.length === 0) return { accounts: [], total: 0 };

        const safePage = Number.isFinite(page) && page > 0 ? page : 1;
        const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 200;
        const skip = (safePage - 1) * safeLimit;

        const pipeline = [
          {
            $match: {
              callfile: { $in: allowedCallfileIds },
            },
          },
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer_info",
            },
          },
          {
            $unwind: {
              path: "$customer_info",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          {
            $unwind: {
              path: "$account_bucket",
              preserveNullAndEmptyArrays: true,
            },
          },
        ];

        if (search && String(search).trim()) {
          const s = String(search).trim();
          pipeline.push({
            $match: {
              $or: [
                { "customer_info.fullName": { $regex: s, $options: "i" } },
                { "account_bucket.name": { $regex: s, $options: "i" } },
                { "account_bucket.dept": { $regex: s, $options: "i" } },
                { "customer_info.gender": { $regex: s, $options: "i" } },
                {
                  "customer_info.contact_no": {
                    $elemMatch: { $regex: s, $options: "i" },
                  },
                },
                { case_id: { $regex: s, $options: "i" } },
                { account_id: { $regex: s, $options: "i" } },
              ],
            },
          });
        }

        pipeline.push(
          {
            $project: {
              _id: 1,
              case_id: 1,
              account_id: 1,
              endorsement_date: 1,
              credit_customer_id: 1,
              bill_due_date: 1,
              client_type: 1,
              overdue_balance: 1,
              client_id: 1,
              due_date: 1,
              loan_start: 1,
              max_dpd: 1,
              balance: 1,
              month_pd: 1,
              dpd: 1,
              paid_amount: 1,
              batch_no: 1,
              out_standing_details: 1,
              account_update_history: 1,
              grass_details: 1,
              account_bucket: "$account_bucket",
              customer_info: "$customer_info",
              emergency_contact: 1,
              assigned: 1,
              assigned_date: 1,
              current_disposition: 1,
              dispo_history: 1,
            },
          },
          {
            $facet: {
              accounts: [{ $skip: skip }, { $limit: safeLimit }],
              total: [{ $count: "count" }],
            },
          },
          {
            $project: {
              accounts: 1,
              total: {
                $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0],
              },
            },
          }
        );

        const result = await CustomerAccount.aggregate(pipeline);
        const first = result?.[0] ?? { accounts: [], total: 0 };
        return first;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
  CustomerAccount: {
    assigned: async (parent) => {
      try {
        const group = await Group.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(parent.assigned),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "members",
              foreignField: "_id",
              as: "members",
            },
          },
        ]);

        if (group.length > 0) return group[0];

        const user = await User.findById(parent.assigned);
        return user;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },

  Assigned: {
    __resolveType(obj) {
      if ("members" in obj) {
        return "Group";
      } else if ("username" in obj) {
        return "User";
      } else {
        return null;
      }
    },
  },

  Mutation: {
    createCustomer: async (
      _,
      { input, callfile, bucket },
      { user, pubsub, PUBSUB_EVENTS }
    ) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      try {
        const findBucket = await Bucket.findById(bucket);
        if (!findBucket) throw new CustomError("Bucket not found", 404);

        const callfilePrincipal = input
          .map((x) => x.principal_os)
          .reduce((t, v) => t + v, 0);
        const callfileOB = input
          .map((x) => x.total_os)
          .reduce((t, v) => t + v, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let newCallfile = await Callfile.findOne({
          name: callfile.toUpperCase(),
          active: true,
          bucket: findBucket?._id,
        });

        if (!newCallfile) {
          newCallfile = await Callfile.create({
            name: callfile,
            bucket: findBucket._id,
            totalAccounts: input.length,
            totalPrincipal: callfilePrincipal,
            totalOB: callfileOB,
          });
        } else {
          await Callfile.findByIdAndUpdate(
            newCallfile._id,
            {
              $inc: {
                totalAccounts: input.length,
                totalPrincipal: callfilePrincipal,
                totalOB: callfileOB,
              },
            },
            { new: true }
          );
        }

        const customerDocs = input.map((e) => ({
          fullName: e.customer_name,
          platform_customer_id: e.platform_user_id || null,
          gender: e.gender || "O",
          dob: e.birthday || null,
          addresses: e.address,
          emails: e.email,
          contact_no: e.contact,
          callfile: newCallfile._id,
          emergency_contact: {
            name: e.emergencyContactName,
            mobile: e.emergencyContactMobile,
          },
        }));

        const insertedCustomers = await Customer.insertMany(customerDocs, {
          ordered: false,
        });

        const customerAccountDocs = input.map((e, i) => {
          const customer = insertedCustomers[i];
          return {
            customer: customer._id,
            bucket: findBucket._id,
            case_id: e.case_id,
            callfile: newCallfile._id,
            credit_customer_id: e.credit_user_id,
            client_type: e.client_type,
            overdue_balance: e.overdue_balance,
            client_id: e.client_id,
            due_date: e.due_date,
            loan_start: e.loan_start,
            endorsement_date: e.endorsement_date,
            bill_due_date: e.bill_due_date,
            max_dpd: e.max_dpd,
            dpd: e.dpd,
            balance: e.balance,
            month_pd: e.mpd,
            paid_amount: e.total_os - e.balance,
            features: { branch: e.branch },
            out_standing_details: {
              principal_os: e.principal_os,
              interest_os: e.interest_os,
              admin_fee_os: e.admin_fee_os,
              txn_fee_os: e.txn_fee_os,
              late_charge_os: e.late_charge_os,
              penalty_interest_os: e.penalty_interest_os,
              dst_fee_os: e.dst_fee_os,
              waive_fee_os: e.late_charge_waive_fee_os,
              total_os: e.total_os,
              total_balance: e.balance,
              writeoff_balance: e.writeoff_balance,
              overall_balance: e.overall_balance,
              cf: e.cf,
              mo_balance: e.mo_balance,
              pastdue_amount: e.pastdue_amount,
              mo_amort: e.mo_amort,
              partial_payment_w_service_fee: e.partial_payment_w_service_fee,
              new_tad_with_sf: e.new_tad_with_sf,
              new_pay_off: e.new_pay_off,
              service_fee: e.service_fee,
              year: e.year,
              brand: e.brand,
              model: e.model,
              last_payment_date: e.last_payment_date,
              last_payment_amount: e.last_payment_amount,
              term: e.term,
              paid: e.paid,
              rem_months: e.rem_months,
              product: e.product,
              client_type: e.client_type,
              overdue_balance: e.overdue_balance,
              client_id: e.client_id,
              loan_start: e.loan_start,
              due_date: e.due_date,
            },
            emergency_contact: {
              name: e.emergencyContactName,
              mobile: e.emergencyContactMobile,
            },
            grass_details: {
              grass_region: e.grass_region,
              vendor_endorsement: e.vendor_endorsement,
              grass_date: e.grass_date,
            },
            on_hands: null,
          };
        });

        // Insert customer accounts in bulk
        const insertedAccounts = await CustomerAccount.insertMany(
          customerAccountDocs,
          { ordered: false }
        );

        const bulkOps = insertedCustomers.map((cust, idx) => ({
          updateOne: {
            filter: { _id: cust._id },
            update: { customer_account: insertedAccounts[idx]._id },
          },
        }));

        if (bulkOps.length > 0) {
          await Customer.bulkWrite(bulkOps);
        }

        await pubsub.publish(PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE, {
          newCallfile: {
            bucket: bucket,
            message: PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE,
          },
        });

        return {
          success: true,
          message: "Callfile successfully created",
        };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    updateCustomer: async (
      _,
      { fullName, dob, gender, addresses, mobiles, emails, id, isRPC },
      { user }
    ) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const safeEmails = Array.isArray(emails) ? emails : [];
        const safeMobiles = Array.isArray(mobiles) ? mobiles : [];
        const filtersEmail = safeEmails.filter(
          (x) => typeof x === "string" && x.trim() !== ""
        );
        const filtersMobile = safeMobiles.filter(
          (x) => typeof x === "string" && x.trim() !== ""
        );
        const findCustomer = await Customer.findById(id);
        const ToUpdate = {
          fullName,
          dob,
          gender,
          addresses,
          emails: filtersEmail.length > 0 ? filtersEmail : [],
          contact_no: filtersMobile.length > 0 ? filtersMobile : [],
          isRPC,
        };

        if (findCustomer.isRPC !== isRPC && isRPC === true) {
          ToUpdate["RPC_date"] = new Date();
        }

        const customer = await Customer.findByIdAndUpdate(
          findCustomer._id,
          {
            $set: ToUpdate,
            $push: {
              updatedBy: {
                user: user._id,
                updatedType: "Update Customer Info",
              },
            },
          },
          { new: true }
        );

        if (!customer) throw new CustomError("Customer not found", 404);
        return {
          success: true,
          message: "Customer successfully updated",
          customer,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    updateRPC: async (_, { id }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const customer = await Customer.findByIdAndUpdate(
          id,
          {
            $set: {
              isRPC: true,
              RPC_date: new Date(),
            },
            $push: {
              updatedBy: {
                user: user._id,
                updatedType: "ISRPC",
              },
            },
          },
          { new: true }
        );
        if (!customer) throw new CustomError("Customer not found", 404);
        return {
          success: true,
          message: "Customer successfully updated",
          customer,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
};

export default customerResolver;
