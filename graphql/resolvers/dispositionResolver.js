import mongoose, { Types } from "mongoose";
import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import CustomerAccount from "../../models/customerAccount.js";
import Disposition from "../../models/disposition.js";
import Production from "../../models/production.js";
import User from "../../models/user.js";
import Bucket from "../../models/bucket.js";
import DispoType from "../../models/dispoType.js";
import Group from "../../models/group.js";
import Department from "../../models/department.js";
import Callfile from "../../models/callfile.js";
import { features } from "process";

const dispositionResolver = {
  DateTime,
  Query: {
    getAccountDispoCount: async (_, { id }) => {
      try {
        const dispositionCount = await Disposition.countDocuments({
          customer_account: new mongoose.Types.ObjectId(id),
        });
        return { count: dispositionCount };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAccountDispositions: async (_, { id, limit }) => {
      try {
        const dispositionCount = await Disposition.countDocuments({
          customer_account: new mongoose.Types.ObjectId(id),
        });

        const disposition = await Disposition.aggregate([
          {
            $match: {
              customer_account: new mongoose.Types.ObjectId(id),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "created_by",
              pipeline: [{ $project: { agent_id: 1, name: 1 } }],
            },
          },
          {
            $unwind: { path: "$created_by", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "ca_disposition",
              pipeline: [{ $project: { name: 1, code: 1, _id: 1 } }],
            },
          },
          {
            $unwind: {
              path: "$ca_disposition",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: "$_id",
              ca_disposition: {
                $first: "$ca_disposition",
              },
              amount: { $first: "$amount" },
              payment_date: { $first: "$payment_date" },
              ref_no: { $first: "$ref_no" },
              existing: { $first: "$existing" },
              comment: { $first: "$comment" },
              payment: { $first: "$payment" },
              payment_method: { $first: "$payment_method" },
              createdAt: { $first: "$createdAt" },
              contact_method: { $first: "$contact_method" },
              created_by: {
                $first: {
                  $cond: [
                    { $ifNull: ["$created_by.agent_id", false] },
                    "$created_by.agent_id",
                    "$created_by.name",
                  ],
                },
              },
            },
          },

          {
            $project: {
              _id: 1,
              amount: 1,
              ca_disposition: 1,
              payment_date: 1,
              ref_no: 1,
              existing: 1,
              comment: 1,
              payment: 1,
              payment_method: 1,
              createdAt: 1,
              created_by: 1,
              contact_method: 1,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: limit === 3 ? limit : dispositionCount,
          },
        ]);
        return disposition;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getDispositionReports: async (_, { reports }) => {
      try {
        const { agent, disposition, from, to, callfile } = reports || {};

        const [agentUser, findDispositions] = await Promise.all([
          await User.findOne({ user_id: agent }).lean(),
          await DispoType.find({ name: { $in: disposition } }).lean(),
        ]);

        if (!agentUser) throw new CustomError("Agent not found", 404);

        const dispoTypesIds =
          disposition?.length > 0
            ? findDispositions?.map((dt) => new mongoose.Types.ObjectId(dt._id))
            : [];

        const query = { current_disposition: { $exists: true } };

        if (agent) {
          query["user"] = new mongoose.Types.ObjectId(agentUser?._id);
        }

        if (disposition?.length > 0)
          query["disposition"] = { $in: dispoTypesIds };

        if (from || to) {
          const startDate = from ? new Date(from) : new Date();
          const endDate = to ? new Date(to) : new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          query["createdAt"] = { $gte: startDate, $lte: endDate };
        }

        let call = null;
        if (Types.ObjectId.isValid(callfile)) {
          query["callfile"] = new Types.ObjectId(callfile);
          call = await Callfile.findById(callfile).lean().populate("bucket");
        }

        const dispositionReport = await CustomerAccount.aggregate([
          { $match: query },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "cd",
            },
          },
          {
            $unwind: { path: "$cd", preserveNullAndEmptyArrays: true },
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
            $facet: {
              toolsDispoCount: [
                {
                  $group: {
                    _id: {
                      callMethod: "$cd.contact_method",
                      name: "$dispotype.name",
                      code: "$dispotype.code",
                      status: "$dispotype.status",
                    },
                    amount: { $sum: "$out_standing_details.principal_os" },
                    count: { $sum: 1 },
                  },
                },
                {
                  $sort: {
                    "_id.status": 1,
                    count: -1,
                  },
                },
                {
                  $group: {
                    _id: "$_id.callMethod",
                    dispositions: {
                      $push: {
                        name: "$_id.name",
                        code: "$_id.code",
                        status: "$_id.status",
                        amount: "$amount",
                        count: "$count",
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    call_method: "$_id",
                    dispositions: 1,
                  },
                },
                {
                  $sort: {
                    call_method: 1,
                  },
                },
              ],
              RFDCounts: [
                {
                  $group: {
                    _id: "$cd.RFD",
                    count: { $sum: 1 },
                  },
                },
                {
                  $project: {
                    _id: "$_id",
                    count: 1,
                  },
                },
              ],
            },
          },
        ]);

        const toolsDispoCount = dispositionReport[0].toolsDispoCount || [];
        const RFDS = dispositionReport[0].RFDCounts || [];

        return {
          agent: agent ? agentUser : null,
          bucket: call?.bucket?.name ?? "",
          callfile: call,
          RFD: RFDS || 0,
          toolsDispoCount: toolsDispoCount || 0,
        };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },

    getAllDispositionTypes: async () => {
      try {
        return await DispoType.find({ code: { $ne: "SET" } }).lean();
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    getDailyFTE: async (_, { bucket }) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const dailyFTE = await Disposition.aggregate([
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            },
          },
          {
            $unwind: {
              path: "$customerAccount",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "bucket",
            },
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "dispo_user",
            },
          },
          {
            $unwind: { path: "$dispo_user", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              createdAt: { $gte: todayStart, $lt: todayEnd },
              "bucket._id": new mongoose.Types.ObjectId(bucket),
              "dispo_user.type": "AGENT",
            },
          },
          {
            $group: {
              _id: "$user",
              online: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              totalUsers: 1,
            },
          },
        ]);

        return dailyFTE[0];
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAOMPTPPerDay: async (_, __, { user }) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const aomCampaign = await Department.find({ aom: user._id }).lean();
        const aomCampaignNameArray = aomCampaign.map((e) => e.name);
        const campaignBucket = await Bucket.find({
          dept: { $in: aomCampaignNameArray },
        }).lean();
        const newArrayCampaignBucket = campaignBucket.map((e) => e._id);

        const PTPOfMonth = await Disposition.aggregate([
          {
            $match: {
              createdAt: { $gte: todayStart, $lt: todayEnd },
            },
          },
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            },
          },
          {
            $unwind: {
              path: "$customerAccount",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "bucket",
            },
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "bucket._id": { $in: newArrayCampaignBucket },
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },

          {
            $match: {
              "dispotype.code": "PTP",
            },
          },
          {
            $group: {
              _id: "$bucket.dept",
              calls: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "calls"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              sms: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "sms"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              email: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "email"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              skip: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "skip"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              field: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "field"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              total: { $sum: "$amount" },
            },
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              skip: 1,
              calls: 1,
              sms: 1,
              email: 1,
              field: 1,
              total: 1,
            },
          },
        ]);

        const newPTPOfMonth = PTPOfMonth.map((pom) => {
          const campaign = aomCampaign.find((ac) => pom.campaign === ac.name);
          return {
            ...pom,
            campaign: campaign ? campaign._id : null,
          };
        });

        return newPTPOfMonth;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAOMPTPKeptPerDay: async (_, __, { user }) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const aomCampaign = await Department.find({ aom: user._id }).lean();
        const aomCampaignNameArray = aomCampaign.map((e) => e.name);
        const campaignBucket = await Bucket.find({
          dept: { $in: aomCampaignNameArray },
        }).lean();
        const newArrayCampaignBucket = campaignBucket.map((e) => e._id);

        const PTPKeptOfMonth = await Disposition.aggregate([
          {
            $match: {
              createdAt: { $gte: todayStart, $lt: todayEnd },
              ptp: true,
            },
          },

          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            },
          },
          {
            $unwind: {
              path: "$customerAccount",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "bucket",
            },
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "bucket._id": { $in: newArrayCampaignBucket },
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "dispotype.code": "PAID",
            },
          },
          {
            $group: {
              _id: "$bucket.dept",
              calls: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "calls"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              sms: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "sms"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              email: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "email"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              skip: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "skip"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              field: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "field"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              total: { $sum: "$amount" },
            },
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              skip: 1,
              calls: 1,
              sms: 1,
              email: 1,
              field: 1,
              total: 1,
            },
          },
        ]);

        const newPTPKeptOfMonth = PTPKeptOfMonth.map((pom) => {
          const campaign = aomCampaign.find((ac) => pom.campaign === ac.name);
          return {
            ...pom,
            campaign: campaign ? campaign._id : null,
          };
        });

        return newPTPKeptOfMonth;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAOMPaidPerDay: async (_, __, { user }) => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const aomCampaign = await Department.find({ aom: user._id }).lean();
        const aomCampaignNameArray = aomCampaign.map((e) => e.name);
        const campaignBucket = await Bucket.find({
          dept: { $in: aomCampaignNameArray },
        }).lean();
        const newArrayCampaignBucket = campaignBucket.map((e) => e._id);

        const PTPKeptOfMonth = await Disposition.aggregate([
          {
            $match: {
              createdAt: { $gte: todayStart, $lt: todayEnd },
              ptp: false,
            },
          },

          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            },
          },
          {
            $unwind: {
              path: "$customerAccount",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "bucket",
            },
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "bucket._id": { $in: newArrayCampaignBucket },
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "dispotype.code": "PAID",
            },
          },
          {
            $group: {
              _id: "$bucket.dept",
              calls: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "calls"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              sms: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "sms"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              email: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "email"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              skip: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "skip"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              field: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$contact_method", "field"],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              total: { $sum: "$amount" },
            },
          },
          {
            $project: {
              _id: 0,
              campaign: "$_id",
              skip: 1,
              calls: 1,
              sms: 1,
              email: 1,
              field: 1,
              total: 1,
            },
          },
        ]);

        const newPTPKeptOfMonth = PTPKeptOfMonth.map((pom) => {
          const campaign = aomCampaign.find((ac) => pom.campaign === ac.name);
          return {
            ...pom,
            campaign: campaign ? campaign._id : null,
          };
        });

        return newPTPKeptOfMonth;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getTLPTPTotals: async (_, { input }) => {
      try {
        const selectedBucket = await Bucket.findById(input.bucket).lean();

        if (!selectedBucket) return null;

        const callfile = (
          await Callfile.find({ bucket: selectedBucket?._id }).lean()
        ).map((x) => new mongoose.Types.ObjectId(x._id));
        if (callfile.length <= 0) return null;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setMilliseconds(-1);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endOfMonth.setMilliseconds(-1);

        let selectedInterval = {};
        if (input.interval === "daily") {
          selectedInterval["$gt"] = todayStart;
          selectedInterval["$lte"] = todayEnd;
        } else if (input.interval === "weekly") {
          selectedInterval["$gt"] = startOfWeek;
          selectedInterval["$lte"] = endOfWeek;
        } else if (input.interval === "monthly") {
          selectedInterval["$gt"] = startOfMonth;
          selectedInterval["$lte"] = endOfMonth;
        }

        const existingCalllfile = await Callfile.findOne({
          bucket: selectedBucket._id,
          active: true,
        });

        const dispotypesPositive = (
          await DispoType.find({ status: 1 }).lean()
        ).map((dt) => new mongoose.Types.ObjectId(dt._id));

        const customerAccount = await CustomerAccount.aggregate([
          {
            $match: {
              $expr: { $gt: [{ $size: "$history" }, 0] },
              callfile: { $eq: existingCalllfile._id },
            },
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "history",
              foreignField: "_id",
              as: "histories",
            },
          },
          {
            $addFields: {
              histories: {
                $filter: {
                  input: "$histories",
                  as: "h",
                  cond: { $in: ["$$h.disposition", dispotypesPositive] },
                },
              },
            },
          },
          {
            $match: {
              $expr: { $gt: [{ $size: "$histories" }, 0] },
            },
          },
        ]);

        const PTP = await Disposition.aggregate([
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            },
          },
          {
            $unwind: {
              path: "$customerAccount",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "callfiles",
              localField: "callfile",
              foreignField: "_id",
              as: "accountCallfile",
            },
          },
          {
            $unwind: {
              path: "$accountCallfile",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "bucket",
            },
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              createdAt: selectedInterval,
              callfile: { $in: callfile },
              $or: [
                {
                  $and: [
                    {
                      "customerAccount.case_id": {
                        $nin: customerAccount.map((ca) => ca.case_id),
                      },
                    },
                    { "accountCallfile.active": { $eq: false } },
                  ],
                },
                { "accountCallfile.active": { $eq: true } },
              ],
              $or: [
                {
                  $and: [{ "dispotype.code": "PTP" }, { existing: true }],
                },
                {
                  $and: [
                    { "dispotype.code": "PAID" },
                    { selectivesDispo: false },
                    { ptp: true },
                    { existing: true },
                  ],
                },
              ],
            },
          },
          {
            $group: {
              _id: 0,
              count: {
                $sum: 1,
              },
              amount: {
                $sum: "$amount",
              },
            },
          },
          {
            $project: {
              _id: 0,
              count: 1,
              amount: 1,
            },
          },
        ]);

        return PTP[0];
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getTLPTPKeptTotals: async (_, { input }) => {
      try {
        const selectedBucket = await Bucket.findById(input.bucket).lean();

        if (!selectedBucket) return null;

        const callfile = (
          await Callfile.find({ bucket: selectedBucket._id }).lean()
        ).map((x) => new mongoose.Types.ObjectId(x._id));
        if (callfile.length <= 0) return null;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setMilliseconds(-1);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endOfMonth.setMilliseconds(-1);

        let selectedInterval = {};

        if (input.interval === "daily") {
          selectedInterval["$gt"] = todayStart;
          selectedInterval["$lte"] = todayEnd;
        } else if (input.interval === "weekly") {
          selectedInterval["$gt"] = startOfWeek;
          selectedInterval["$lte"] = endOfWeek;
        } else if (input.interval === "monthly") {
          selectedInterval["$gt"] = startOfMonth;
          selectedInterval["$lte"] = endOfMonth;
        }

        const PTPKept = await Disposition.aggregate([
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            },
          },
          {
            $unwind: {
              path: "$customerAccount",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "bucket",
            },
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              createdAt: selectedInterval,
              "dispotype.code": "PAID",
              ptp: true,
              selectivesDispo: true,
              callfile: { $in: callfile },
            },
          },
          {
            $group: {
              _id: 0,
              count: {
                $sum: 1,
              },
              amount: {
                $sum: "$amount",
              },
            },
          },
          {
            $project: {
              _id: 0,
              count: 1,
              amount: 1,
            },
          },
        ]);
        return PTPKept[0];
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getTLPaidTotals: async (_, { input }) => {
      try {
        const selectedBucket = await Bucket.findById(input.bucket).lean();
        if (!selectedBucket) return null;

        const callfile = (
          await Callfile.find({ bucket: selectedBucket._id })
        ).map((x) => new mongoose.Types.ObjectId(x._id));

        if (callfile.length < 1) return null;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setMilliseconds(-1);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endOfMonth.setMilliseconds(-1);

        let selectedInterval = {};
        if (input.interval === "daily") {
          selectedInterval["$gt"] = todayStart;
          selectedInterval["$lte"] = todayEnd;
        } else if (input.interval === "weekly") {
          selectedInterval["$gt"] = startOfWeek;
          selectedInterval["$lte"] = endOfWeek;
        } else if (input.interval === "monthly") {
          selectedInterval["$gt"] = startOfMonth;
          selectedInterval["$lte"] = endOfMonth;
        }

        const paid = await Disposition.aggregate([
          {
            $lookup: {
              from: "customeraccounts",
              localField: "customer_account",
              foreignField: "_id",
              as: "customerAccount",
            },
          },
          {
            $unwind: {
              path: "$customerAccount",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "customerAccount.bucket",
              foreignField: "_id",
              as: "bucket",
            },
          },
          {
            $unwind: { path: "$bucket", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              createdAt: selectedInterval,
              "dispotype.code": "PAID",
              selectivesDispo: true,
              callfile: { $in: callfile },
            },
          },
          {
            $group: {
              _id: "$customerAccount.case_id",
              count: { $sum: 1 },
              amount: { $sum: "$amount" },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              amount: { $sum: "$amount" },
            },
          },
          {
            $project: {
              _id: 0,
              count: 1,
              amount: 1,
            },
          },
        ]);

        return paid[0];
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getTLDailyCollected: async (_, { input }) => {
      try {
        const selectedBucket = await Bucket.findById(input.bucket).lean();
        const callfile = (
          await Callfile.find({ bucket: selectedBucket?._id })
        ).map((c) => new mongoose.Types.ObjectId(c._id));

        if (callfile.length < 1) return null;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setMilliseconds(-1);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endOfMonth.setMilliseconds(-1);

        let selectedInterval = {};
        if (input.interval === "daily") {
          selectedInterval["$gt"] = todayStart;
          selectedInterval["$lte"] = todayEnd;
        } else if (input.interval === "weekly") {
          selectedInterval["$gt"] = startOfWeek;
          selectedInterval["$lte"] = endOfWeek;
        } else if (input.interval === "monthly") {
          selectedInterval["$gt"] = startOfMonth;
          selectedInterval["$lte"] = endOfMonth;
        }

        const rpcCount = ["PTP", "PAID", "UNEG", "DISP", "RTP", "FFUP"];

        const TotalRPC = await Disposition.aggregate([
          {
            $match: {
              callfile: { $in: callfile },
              createdAt: selectedInterval,
              selectivesDispo: false,
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "dispotype.code": { $in: rpcCount },
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
              from: "customers",
              localField: "ca.customer",
              foreignField: "_id",
              as: "customer",
            },
          },
          {
            $unwind: { path: "$customer", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "customer.isRPC": true,
            },
          },
          {
            $group: {
              _id: "$ca.case_id",
            },
          },
          {
            $group: {
              _id: null,
              isRPC: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              isRPC: 1,
            },
          },
        ]);

        return TotalRPC[0];
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    agentDispoDaily: async (_, { bucket, interval }) => {
      try {
        const selectedBucket = await Bucket.findById(bucket).lean();
        if (!selectedBucket) return null;

        const callfile = (
          await Callfile.find({ bucket: selectedBucket._id }).lean()
        ).map((cf) => new mongoose.Types.ObjectId(cf._id));
        const existingCallfile = await Callfile.findOne({ active: true });
        if (callfile.length <= 0) return null;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setMilliseconds(-1);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endOfMonth.setMilliseconds(-1);

        let filter = { selectivesDispo: false };

        if (interval === "daily") {
          (filter["callfile"] = { $in: callfile }),
            (filter["createdAt"] = { $gt: todayStart, $lte: todayEnd });
        } else if (interval === "weekly") {
          (filter["callfile"] = { $in: callfile }),
            (filter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek });
        } else if (interval === "monthly") {
          (filter["callfile"] = { $in: callfile }),
            (filter["createdAt"] = { $gt: startOfMonth, $lte: endOfMonth });
        } else if (interval === "callfile") {
          filter["callfile"] = new mongoose.Types.ObjectId(
            existingCallfile._id
          );
        }
        const rpcCount = ["PTP", "PAID", "UNEG", "DISP", "RTP", "FFUP"];

        const RPCCount = await Disposition.aggregate([
          {
            $match: filter,
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "dispotype.code": { $in: rpcCount },
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
              from: "customers",
              localField: "ca.customer",
              foreignField: "_id",
              as: "customer",
            },
          },
          {
            $unwind: { path: "$customer", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "customer.isRPC": true,
            },
          },
          {
            $group: {
              _id: {
                case_id: "$ca.case_id",
                user: "$user",
              },
            },
          },
          {
            $group: {
              _id: "$_id.user",
              rpc: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 1,
              rpc: 1,
            },
          },
        ]);

        const disposition = await Disposition.aggregate([
          {
            $match: filter,
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "dispo_user",
            },
          },
          {
            $unwind: { path: "$dispo_user", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "dispotype.code": { $in: ["PTP", "PAID"] },
              "dispo_user.type": "AGENT",
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
            $group: {
              _id: "$user",
              ptp: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        {
                          $and: [
                            { $eq: ["$dispotype.code", "PTP"] },
                            { $eq: ["$existing", true] },
                          ],
                        },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              kept: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$dispotype.code", "PAID"] },
                        { $eq: ["$ptp", true] },
                        { $eq: ["$selectivesDispo", true] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              user: "$_id",
              ptp: 1,
              kept: 1,
            },
          },
        ]);

        const newResult = disposition.map((d) => {
          const userRPC = RPCCount.find(
            (rpc) => rpc?._id.toString() === d.user?.toString()
          );
          return {
            ...d,
            RPC: userRPC ? userRPC.rpc : 0,
          };
        });

        return newResult;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getTargetPerCampaign: async (_, { bucket, interval }) => {
      try {
        const buckets = await Bucket.findById(bucket);
        if (!buckets) return null;

        const callfile = await Callfile.findOne({
          bucket: buckets._id,
          active: { $eq: true },
        });

        if (!callfile) return null;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setMilliseconds(-1);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endOfMonth.setMilliseconds(-1);

        let selectedInterval = {};
        let newDataCollected = {};
        if (interval === "daily" || buckets.principal) {
          selectedInterval["$gt"] = todayStart;
          selectedInterval["$lte"] = todayEnd;
          newDataCollected["target"] = Number(callfile.target) / 4 / 6;
        } else if (interval === "weekly" && !buckets.principal) {
          selectedInterval["$gt"] = startOfWeek;
          selectedInterval["$lte"] = endOfWeek;
          newDataCollected["target"] = Number(callfile.target) / 4;
        } else if (interval === "monthly" && !buckets.principal) {
          selectedInterval["$gt"] = startOfMonth;
          selectedInterval["$lte"] = endOfMonth;
          newDataCollected["target"] = Number(callfile.target);
        }

        let result = {};

        if (buckets.principal) {
          const customerAccount = await CustomerAccount.aggregate([
            {
              $lookup: {
                from: "dispositions",
                localField: "history",
                foreignField: "_id",
                as: "account_history",
              },
            },
            {
              $lookup: {
                from: "callfiles",
                localField: "callfile",
                foreignField: "_id",
                as: "account_callfile",
              },
            },
            {
              $unwind: {
                path: "$account_callfile",
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
                callfile: { $eq: new mongoose.Types.ObjectId(callfile._id) },
                current_disposition: { $exists: true },
                createdAt: selectedInterval,
              },
            },
            {
              $group: {
                _id: "$callfile",
                collected: {
                  $sum: {
                    $cond: [
                      { $eq: ["$balance", 0] },
                      "$out_standing_details.principal_os",
                      0,
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                collected: 1,
              },
            },
          ]);

          result = customerAccount.map((x) => {
            return {
              ...x,
              totalPrincipal: callfile.totalPrincipal || 0,
              target: callfile.target || 0,
            };
          })[0];
        } else {
          const existingCallfile = await Callfile.findOne({
            bucket: buckets._id,
            active: { $eq: true },
          }).lean();

          const AllBucketCallfile = (
            await Callfile.find({ bucket: buckets._id }).lean()
          ).map((bucket) => bucket._id);

          const findDisposition = await Disposition.aggregate([
            {
              $match: {
                callfile: {
                  $in: AllBucketCallfile.map(
                    (e) => new mongoose.Types.ObjectId(e)
                  ),
                },
                createdAt: selectedInterval,
              },
            },
            {
              $lookup: {
                from: "dispotypes",
                localField: "disposition",
                foreignField: "_id",
                as: "dispotype",
              },
            },
            {
              $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
            },
            {
              $match: {
                "dispotype.code": { $eq: "PAID" },
                selectivesDispo: { $eq: true },
              },
            },

            {
              $facet: {
                allCallfile: [
                  {
                    $group: {
                      _id: null,
                      collected: {
                        $sum: "$amount",
                      },
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      collected: 1,
                    },
                  },
                ],
                activeCallfile: [
                  {
                    $match: {
                      callfile: { $eq: existingCallfile._id },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      collected: {
                        $sum: "$amount",
                      },
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      collected: 1,
                    },
                  },
                ],
              },
            },
          ]);

          const collected =
            findDisposition[0]?.allCallfile?.length > 0
              ? findDisposition[0].allCallfile[0].collected
              : 0;

          const totalPrincipal =
            findDisposition[0].activeCallfile?.length > 0
              ? callfile.totalPrincipal +
                (findDisposition[0].activeCallfile[0].collected || 0)
              : callfile.totalPrincipal;

          result = {
            collected: collected,
            target: newDataCollected.target,
            totalPrincipal: totalPrincipal,
          };
        }

        return result
          ? result
          : {
              collected: 0,
              target: callfile?.target || 0,
              totalPrincipal: callfile?.totalPrincipal || 0,
            };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
  },

  Mutation: {
    createDisposition: async (
      _,
      { input },
      { user, pubsub, PUBSUB_EVENTS }
    ) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const [customerAccount, dispoType, userProdRaw] = await Promise.all([
          CustomerAccount.findById(input.customer_account)
            .populate("current_disposition")
            .lean(),
          DispoType.findById(input.disposition).lean(),
          Production.findOne({
            user: user._id,
            createdAt: { $gte: start, $lte: end },
          }).lean(),
        ]);

        const withPayment = ["PTP", "PAID"];
        const currentDispo = customerAccount?.current_disposition;

        if (!customerAccount) {
          throw new CustomError("Customer account not found", 404);
        }

        if (!dispoType)
          throw new CustomError("Disposition type not found", 400);

        if (!userProdRaw) await Production.create({ user: user._id });

        if (
          withPayment.includes(dispoType.code) &&
          !input.amount &&
          input.disposition
        ) {
          throw new CustomError("Amount is required", 401);
        }
        const ptpDispotype = await DispoType.findOne({ code: "PTP" });

        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

        const cdCreatedAt =
          new Date(customerAccount?.current_disposition?.createdAt) <=
          threeDaysAgo;

        const isCurrentPTP =
          currentDispo?.disposition?.toString() ===
          ptpDispotype?._id?.toString();
        const isSameUser =
          currentDispo?.user?.toString() === user?._id?.toString();
        const isPaidDispo = dispoType?.code === "PAID";
        const isPTPDispo = dispoType?.code === "PTP";

        const payment =
          customerAccount.balance - parseFloat(input.amount || 0) === 0
            ? "full"
            : "partial";

        const newDisposition = new Disposition({
          ...input,
          payment: withPayment.includes(dispoType.code) ? payment : null,
          amount: parseFloat(input.amount) || 0,
          user: user._id,
          callId: input.callId,
          "features.partialPayment": input.partialPayment,
          callfile: customerAccount.callfile,
        });

        const group = customerAccount?.assigned
          ? await Group.findById(customerAccount.assigned).lean()
          : null;
        const assigned = group
          ? group?.members
          : customerAccount?.assigned
          ? [customerAccount.assigned]
          : [];

        await pubsub.publish(PUBSUB_EVENTS.DISPOSITION_UPDATE, {
          dispositionUpdated: {
            members: [...new Set([...assigned, user?._id?.toString()])],
            message: "NEW_DISPOSITION",
          },
        });

        const updateFields = {
          on_hands: false,
          "features.alreadyCalled": true,
        };

        const unsetFields = {};

        if (
          isPTPDispo ||
          (currentDispo && isCurrentPTP && dispoType?.status !== 1)
        ) {
          updateFields["assigned"] = user._id;
          updateFields["assignedModel"] = "User";
          updateFields["assigned_date"] = new Date();
        } else {
          unsetFields["assigned"] = "";
          unsetFields["assignedModel"] = "";
          unsetFields["assigned_date"] = "";
        }

        if (
          (currentDispo &&
            isCurrentPTP &&
            isPaidDispo &&
            !cdCreatedAt &&
            isSameUser) ||
          isPTPDispo
        ) {
          newDisposition.ptp = true;

          if (
            currentDispo &&
            isCurrentPTP &&
            isPaidDispo &&
            !cdCreatedAt &&
            isSameUser
          ) {
            await Disposition.findByIdAndUpdate(currentDispo, {
              $set: { paidDispo: newDisposition?._id },
            });
          }
        }

        if (dispoType?.status === 1 && dispoType.code === "PTP") {
          updateFields["isPTP"] = true;
        } else if (dispoType?.status === 1 && dispoType.code !== "PTP") {
          updateFields["isPTP"] = false;
        }

        const currentDispotype = await DispoType.findById(
          customerAccount?.current_disposition?.disposition
        );

        if (!currentDispotype) {
          updateFields["current_disposition"] = newDisposition?._id;
          newDisposition.existing = true;
        } else if (currentDispotype && dispoType.rank > 0) {
          updateFields["current_disposition"] = newDisposition?._id;
          await Disposition.findByIdAndUpdate(
            customerAccount?.current_disposition,
            { $set: { existing: false } }
          );
          newDisposition.existing = true;
        } else if (currentDispotype.rank === 0 && dispoType.rank === 0) {
          updateFields["current_disposition"] = newDisposition._id;
          newDisposition.existing = true;
          await Disposition.findByIdAndUpdate(
            customerAccount?.current_disposition,
            { $set: { existing: false } }
          );
        }

        await newDisposition.save();

        await CustomerAccount.findByIdAndUpdate(
          customerAccount._id,
          {
            ...(Object.keys(updateFields).length && { $set: updateFields }),
            ...(Object.keys(unsetFields).length && { $unset: unsetFields }),
            $push: { history: newDisposition._id },
            $inc: { "features.called": 1 },
          },
          { new: true }
        );

        return {
          success: true,
          message: "Disposition successfully created",
          dispoId: newDisposition._id,
        };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
  },
};

export default dispositionResolver;
