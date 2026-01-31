import mongoose, { Types } from "mongoose";
import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import CustomerAccount from "../../models/customerAccount.js";
import Disposition from "../../models/disposition.js";
import Production from "../../models/production.js";
import User from "../../models/user.js";
import Notification from "../../models/notification.js";
import Bucket from "../../models/bucket.js";
import DispoType from "../../models/dispoType.js";
import Group from "../../models/group.js";
import Department from "../../models/department.js";
import Callfile from "../../models/callfile.js";
import FieldDisposition from "../../models/fieldDisposition.js";
import { safeResolver } from "../../middlewares/safeResolver.js";

const dispositionResolver = {
  DateTime,
  Query: {
    getNotificationsByAssignee: safeResolver(
      async (_, { assigneeId, limit }, { user }) => {
        if (!user) throw new CustomError("Unauthorized", 401);

        if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
          return [];
        }
        
        const safeLimit =
          typeof limit === "number" && limit > 0 ? Math.min(limit, 100) : 20;

        const notifications = await Notification.find({
          assignee: new mongoose.Types.ObjectId(assigneeId),
        })
        
          .sort({ createdAt: -1 })
          .limit(safeLimit)
          .populate({ path: "user", select: "name user_id bucket" })
          .populate({ path: "assignee", select: "name user_id" })
          .select("user assignee bucket task createdAt code")
          .lean();

        return notifications.map((n) => ({
          _id: n._id,
          user: n.user
            ? {
                name: n.user?.name || "Unknown",
                user_id: n.user?.user_id || String(n.user?._id || ""),
              }
            : null,
          assignee: n.assignee?._id || n.assignee || null,
          assigneeUser: n.assignee
            ? {
                name: n.assignee?.name || "Unknown",
                user_id: n.assignee?.user_id || String(n.assignee?._id || ""),
              }
            : null,
          bucket: n.bucket || null,
          task: typeof n.task === "number" ? n.task : 0,
          createdAt: n.createdAt || null,
          code: typeof n.code === "number" ? n.code : 1,
        }));
      },
    ),
    getNotificationsByBucket: safeResolver(
      async (_, { bucketId, limit }, { user }) => {
        if (!user) throw new CustomError("Unauthorized", 401);

        if (!mongoose.Types.ObjectId.isValid(bucketId)) {
          return [];
        }

        const safeLimit =
          typeof limit === "number" && limit > 0 ? Math.min(limit, 100) : 20;

        const notifications = await Notification.find({
          bucket: new mongoose.Types.ObjectId(bucketId),
        })
          .sort({ createdAt: -1 })
          .limit(safeLimit)
          .populate({ path: "user", select: "name user_id" })
          .populate({ path: "assignee", select: "name user_id" })
          .select("user assignee bucket task createdAt code")
          .lean();

        return notifications.map((n) => ({
          _id: n._id,
          user: n.user
            ? {
                name: n.user?.name || "Unknown",
                user_id: n.user?.user_id || String(n.user?._id || ""),
              }
            : null,
          assignee: n.assignee?._id || n.assignee || null,
          assigneeUser: n.assignee
            ? {
                name: n.assignee?.name || "Unknown",
                user_id: n.assignee?.user_id || String(n.assignee?._id || ""),
              }
            : null,
          bucket: n.bucket || null,
          task: typeof n.task === "number" ? n.task : 0,
          createdAt: n.createdAt || null,
          code: typeof n.code === "number" ? n.code : 1,
        }));
      },
    ),
    getFieldDispositionsByCustomerAccounts: safeResolver(
      async (_, { accountIds }, { user }) => {
        if (!user) throw new CustomError("Unauthorized", 401);

        if (!Array.isArray(accountIds) || accountIds.length === 0) {
          return [];
        }

        const invalidId = accountIds.find(
          (id) => !mongoose.Types.ObjectId.isValid(id),
        );
        if (invalidId) {
          throw new CustomError("Invalid customer account", 400);
        }

        const ids = accountIds.map((id) => new mongoose.Types.ObjectId(id));

        const fieldDispositions = await FieldDisposition.find({
          customer_account: { $in: ids },
          user: user._id,
        })
          .select("amount customer_account callfile createdAt")
          .lean();

        return fieldDispositions;
      },
    ),
    getFieldDispositionsByUser: safeResolver(async (_, { limit }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const safeLimit =
        typeof limit === "number" && limit > 0 ? Math.min(limit, 100) : 50;

      const fieldDispositions = await FieldDisposition.find({
        user: user._id,
      })
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .populate({
          path: "disposition",
          select: "name code",
        })
        .populate({
          path: "customer_account",
          select: "customer",
          populate: {
            path: "customer",
            select: "fullName",
          },
        })
        .select("createdAt disposition customer_account")
        .lean();

      return fieldDispositions;
    }),
    getFieldDispositionsByUsers: safeResolver(
      async (_, { userIds, accountIds }, { user }) => {
        if (!user) throw new CustomError("Unauthorized", 401);

        if (!Array.isArray(userIds) || userIds.length === 0) return [];
        if (!Array.isArray(accountIds) || accountIds.length === 0) return [];

        const invalidUserId = userIds.find(
          (id) => !mongoose.Types.ObjectId.isValid(id),
        );
        if (invalidUserId) throw new CustomError("Invalid user id", 400);

        const invalidAccountId = accountIds.find(
          (id) => !mongoose.Types.ObjectId.isValid(id),
        );
        if (invalidAccountId)
          throw new CustomError("Invalid customer account", 400);

        const userObjIds = userIds.map((id) => new mongoose.Types.ObjectId(id));
        const accountObjIds = accountIds.map(
          (id) => new mongoose.Types.ObjectId(id),
        );

        const fieldDispositions = await FieldDisposition.find({
          user: { $in: userObjIds },
          customer_account: { $in: accountObjIds },
        })
          .sort({ createdAt: -1 })
          .populate({
            path: "disposition",
            select: "name code",
          })
          .populate({
            path: "customer_account",
            select: "customer",
            populate: {
              path: "customer",
              select: "fullName",
            },
          })
          .select(
            "createdAt disposition customer_account user amount payment_method payment payment_date ref_no rfd sof comment",
          )
          .lean();

        return fieldDispositions;
      },
    ),
    getAccountDispoCount: safeResolver(async (_, { id }) => {
      const dispositionCount = await Disposition.countDocuments({
        customer_account: new mongoose.Types.ObjectId(id),
      });
      return { count: dispositionCount };
    }),
    getAccountDispositions: safeResolver(async (_, { id, limit }) => {
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
    }),
    getDispositionReports: safeResolver(async (_, { reports }) => {
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
    }),

    getAllDispositionTypes: safeResolver(async () => {
      return await DispoType.find({ code: { $ne: "SET" } }).lean();
    }),

    getDailyFTE: safeResolver(async (_, { bucket }) => {
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
            // "dispo_user.type": "AGENT",
          },
        },
        {
          $group: {
            _id: null,
            totalUsers: { $addToSet: "$dispo_user" },
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
    }),
    getAOMPTPPerDay: safeResolver(async (_, __, { user }) => {
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
    }),
    getAOMPTPKeptPerDay: safeResolver(async (_, __, { user }) => {
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
    }),
    getAOMPaidPerDay: safeResolver(async (_, __, { user }) => {
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
    }),
    getTLPTPTotals: safeResolver(async (_, { input }) => {
      const selectedBucket = await Bucket.findById(input.bucket).lean();

      if (!selectedBucket) return null;

      const callfile = (
        await Callfile.find({ bucket: selectedBucket?._id }).lean()
      ).map((x) => new mongoose.Types.ObjectId(x._id));
      if (callfile.length <= 0) return null;
      const existingCallfile = await Callfile.findOne({
        bucket: selectedBucket._id,
        active: true,
      });

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

      let filter = {};

      if (input.interval === "daily") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: todayStart, $lte: todayEnd }));
      } else if (input.interval === "weekly") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek }));
      } else if (input.interval === "monthly") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: startOfMonth, $lte: endOfMonth }));
      } else if (input.interval === "callfile") {
        filter["callfile"] = new mongoose.Types.ObjectId(existingCallfile?._id);
      }

      if (selectedBucket.principal) {
        if (!existingCallfile) return null;
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
            $lookup: {
              from: "dispositions",
              localField: "paidDispo",
              foreignField: "_id",
              as: "pd",
            },
          },
          {
            $unwind: { path: "$pd", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              callfile: new mongoose.Types.ObjectId(existingCallfile._id),
              "dispotype.code": "PTP",
              existing: true,
              $expr: {
                $eq: ["$amount", "$customerAccount.balance"],
              },
            },
          },
          {
            $group: {
              _id: 0,
              count: {
                $sum: 1,
              },
              amount: {
                $sum: "$customerAccount.out_standing_details.principal_os",
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
      } else {
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
              ...filter,
              $and: [{ "dispotype.code": "PTP" }, { existing: true }],
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
      }
    }),
    getTLPTPKeptTotals: safeResolver(async (_, { input }) => {
      const selectedBucket = await Bucket.findById(input.bucket).lean();

      if (!selectedBucket) return null;

      const callfile = (
        await Callfile.find({ bucket: selectedBucket?._id }).lean()
      ).map((x) => new mongoose.Types.ObjectId(x._id));
      if (callfile.length <= 0) return null;
      const existingCallfile = await Callfile.findOne({
        bucket: selectedBucket._id,
        active: true,
      });

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

      let filter = {
        "dispotype.code": "PAID",
        ptp: true,
        selectivesDispo: true,
        user: { $ne: null },
      };

      if (input.interval === "daily") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: todayStart, $lte: todayEnd }));
      } else if (input.interval === "weekly") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek }));
      } else if (input.interval === "monthly") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: startOfMonth, $lte: endOfMonth }));
      } else if (input.interval === "callfile") {
        filter["callfile"] = new mongoose.Types.ObjectId(existingCallfile?._id);
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
          $match: filter,
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
    }),
    getTLPaidTotals: safeResolver(async (_, { input }) => {
      const { bucket, interval } = input;

      const selectedBucket = await Bucket.findById(bucket).lean();

      if (!selectedBucket) return null;
      const callfile = (
        await Callfile.find({ bucket: selectedBucket._id }).lean()
      ).map((cf) => new mongoose.Types.ObjectId(cf._id));
      const existingCallfile = await Callfile.findOne({
        bucket: selectedBucket._id,
        active: true,
      });
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

      let filter = {
        "dispotype.code": "PAID",
        selectivesDispo: true,
      };

      if (interval === "daily") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: todayStart, $lte: todayEnd }));
      } else if (interval === "weekly") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek }));
      } else if (interval === "monthly") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: startOfMonth, $lte: endOfMonth }));
      } else if (interval === "callfile") {
        filter["callfile"] = new mongoose.Types.ObjectId(existingCallfile._id);
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
          $match: filter,
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
    }),
    getTLDailyCollected: safeResolver(async (_, { input }) => {
      const selectedBucket = await Bucket.findById(input.bucket).lean();

      if (!selectedBucket) return null;

      const callfile = (
        await Callfile.find({ bucket: selectedBucket._id }).lean()
      ).map((cf) => new mongoose.Types.ObjectId(cf._id));
      const existingCallfile = await Callfile.findOne({
        bucket: selectedBucket._id,
        active: true,
      });

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

      if (input.interval === "daily") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: todayStart, $lte: todayEnd }));
      } else if (input.interval === "weekly") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek }));
      } else if (input.interval === "monthly") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: startOfMonth, $lte: endOfMonth }));
      } else if (input.interval === "callfile") {
        filter["callfile"] = new mongoose.Types.ObjectId(existingCallfile?._id);
      }

      const rpcCount = ["PTP", "PAID", "UNEG", "DISP", "RTP", "FFUP"];

      if (selectedBucket.principal) {
        if (!existingCallfile) return null;
        const TotalRPC = await Disposition.aggregate([
          {
            $match: {
              callfile: existingCallfile._id,
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
      } else {
        const TotalRPC = await Disposition.aggregate([
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
      }
    }),
    agentDispoDaily: safeResolver(async (_, { bucket, interval }) => {
      const selectedBucket = await Bucket.findById(bucket).lean();
      if (!selectedBucket) return null;

      const callfile = (
        await Callfile.find({ bucket: selectedBucket._id }).lean()
      ).map((cf) => new mongoose.Types.ObjectId(cf._id));

      const existingCallfile = await Callfile.findOne({
        bucket: selectedBucket?._id,
        active: true,
      });

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

      let RPCfilter = { selectivesDispo: false };
      let filter = {};

      if (interval === "daily") {
        filter["callfile"] = { $in: callfile };
        filter["createdAt"] = { $gt: todayStart, $lte: todayEnd };
        RPCfilter["callfile"] = { $in: callfile };
        RPCfilter["createdAt"] = { $gt: todayStart, $lte: todayEnd };
      } else if (interval === "weekly") {
        RPCfilter["callfile"] = { $in: callfile };
        RPCfilter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek };
        filter["callfile"] = { $in: callfile };
        filter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek };
      } else if (interval === "monthly") {
        filter["callfile"] = { $in: callfile };
        filter["createdAt"] = { $gt: startOfMonth, $lte: endOfMonth };
        RPCfilter["callfile"] = { $in: callfile };
        RPCfilter["createdAt"] = { $gt: startOfMonth, $lte: endOfMonth };
      } else if (interval === "callfile") {
        filter["callfile"] = new mongoose.Types.ObjectId(existingCallfile?._id);
        RPCfilter["callfile"] = new mongoose.Types.ObjectId(
          existingCallfile?._id,
        );
      }

      const rpcCount = ["PTP", "PAID", "UNEG", "DISP", "RTP", "FFUP"];

      if (selectedBucket.principal) {
        if (!existingCallfile) return null;
        const RPCCount = await Disposition.aggregate([
          {
            $match: {
              callfile: existingCallfile._id,
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
            $match: {
              callfile: {
                $eq: new mongoose.Types.ObjectId(existingCallfile._id),
              },
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
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "dispo_user",
            },
          },
          {
            $unwind: {
              path: "$dispo_user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "paidDispo",
              foreignField: "_id",
              as: "pd",
            },
          },
          {
            $unwind: {
              path: "$pd",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "dispotype.code": { $in: ["PTP", "PAID"] },
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
              _id: "$dispo_user._id",
              ptp: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        {
                          $and: [
                            { $eq: ["$dispotype.code", "PTP"] },
                            { $eq: ["$existing", true] },
                            {
                              $expr: {
                                $eq: ["$amount", "$ca.balance"],
                              },
                            },
                          ],
                        },
                        {
                          $and: [
                            { $eq: ["$dispotype.code", "PTP"] },
                            { $eq: ["$pd.selectivesDispo", false] },
                            {
                              $expr: {
                                $eq: ["$amount", "$ca.balance"],
                              },
                            },
                            {
                              $ne: [{ $ifNull: ["$paidDispo", null] }, null],
                            },
                          ],
                        },
                      ],
                    },
                    "$ca.out_standing_details.principal_os",
                    0,
                  ],
                },
              },
              ptcp: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$dispotype.code", "PTP"],
                        },
                        {
                          $ne: [{ $ifNull: ["$paidDispo", null] }, null],
                        },
                        {
                          $expr: {
                            $eq: ["$pd.amount", "$ca.balance"],
                          },
                        },
                      ],
                    },
                    "$ca.out_standing_details.principal_os",
                    0,
                  ],
                },
              },
              confirm: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$dispotype.code", "PAID"],
                        },
                        { $eq: ["selectivesDispo", false] },
                        {
                          $expr: {
                            $eq: ["$amount", "$ca.balance"],
                          },
                        },
                      ],
                    },
                    "$ca.out_standing_details.principal_os",
                    0,
                  ],
                },
              },
              kept: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$ca.balance", 0],
                    },
                    "$ca.out_standing_details.principal_os",
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
              confirm: 1,
              ptcp: 1,
            },
          },
        ]);

        const newResult = disposition.map((d) => {
          const userRPC = RPCCount.find(
            (rpc) => rpc?._id.toString() === d.user?.toString(),
          );
          return {
            ...d,
            RPC: userRPC ? userRPC.rpc : 0,
          };
        });

        return newResult;
      } else {
        const RPCCount = await Disposition.aggregate([
          {
            $match: RPCfilter,
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
            $unwind: {
              path: "$dispo_user",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "dispotype.code": { $in: ["PTP", "PAID"] },
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
              _id: "$dispo_user._id",
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
              ptcp: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$dispotype.code", "PTP"],
                        },
                        {
                          $ne: [{ $ifNull: ["$paidDispo", null] }, null],
                        },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              confirm: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$dispotype.code", "PAID"],
                        },
                        { $eq: ["selectivesDispo", false] },
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
              ptcp: 1,
              confirm: 1,
            },
          },
        ]);

        const newResult = disposition.map((d) => {
          const userRPC = RPCCount.find(
            (rpc) => rpc?._id.toString() === d.user?.toString(),
          );
          return {
            ...d,
            RPC: userRPC ? userRPC.rpc : 0,
          };
        });

        return newResult;
      }
    }),
    getTargetPerCampaign: safeResolver(async (_, { bucket, interval }) => {
      const selectedBucket = await Bucket.findById(bucket).lean();

      if (!selectedBucket) return null;

      const callfile = (
        await Callfile.find({ bucket: selectedBucket._id }).lean()
      ).map((cf) => new mongoose.Types.ObjectId(cf._id));

      const existingCallfile = await Callfile.findOne({
        bucket: selectedBucket._id,
        active: true,
      }).lean();

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

      let filter = {
        "dispotype.code": { $eq: "PAID" },
        selectivesDispo: { $eq: true },
      };

      let newDataCollected = {};

      if (interval === "daily") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: todayStart, $lte: todayEnd }));
        newDataCollected["target"] = existingCallfile?.target
          ? Number(existingCallfile?.target) / 4 / 6
          : 0;
      } else if (interval === "weekly") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek }));
        newDataCollected["target"] = existingCallfile?.target
          ? Number(existingCallfile?.target) / 4
          : 0;
      } else if (interval === "monthly") {
        ((filter["callfile"] = { $in: callfile }),
          (filter["createdAt"] = { $gt: startOfMonth, $lte: endOfMonth }));
        newDataCollected["target"] = existingCallfile?.target
          ? Number(existingCallfile?.target)
          : 0;
      } else if (interval === "callfile") {
        newDataCollected["target"] = existingCallfile?.target
          ? Number(existingCallfile?.target)
          : 0;
        filter["callfile"] = new mongoose.Types.ObjectId(existingCallfile?._id);
      }

      let result = {};

      if (selectedBucket.principal) {
        if (!existingCallfile) return null;

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
              callfile: {
                $eq: new mongoose.Types.ObjectId(existingCallfile._id),
              },
              current_disposition: { $exists: true },
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
        const findDisposition = await Disposition.aggregate([
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
            $match: filter,
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
            ? existingCallfile.totalPrincipal +
              (findDisposition[0].activeCallfile[0].collected || 0)
            : existingCallfile.totalPrincipal;

        result = {
          collected: collected,
          totalPrincipal: totalPrincipal,
          target: newDataCollected.target,
        };
      }

      return result
        ? result
        : {
            collected: 0,
            target: callfile?.target || 0,
            totalPrincipal: callfile?.totalPrincipal || 0,
          };
    }),
  },
  Mutation: {
    createFieldDisposition: safeResolver(async (_, { input }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);

      const {
        disposition,
        payment_method,
        payment,
        payment_date,
        amount,
        ref_no,
        rfd,
        sof,
        customer_account,
        callfile,
        comment,
        user: inputUser,
      } = input;

      if (!mongoose.Types.ObjectId.isValid(customer_account)) {
        throw new CustomError("Invalid customer account", 400);
      }
      if (!mongoose.Types.ObjectId.isValid(disposition)) {
        throw new CustomError("Invalid disposition", 400);
      }
      if (callfile && !mongoose.Types.ObjectId.isValid(callfile)) {
        throw new CustomError("Invalid callfile", 400);
      }

      const fieldDisposition = await FieldDisposition.create({
        disposition,
        payment_method: payment_method || null,
        payment: payment || null,
        payment_date: payment_date || null,
        amount: typeof amount === "number" ? amount : null,
        ref_no: ref_no || null,
        rfd: rfd || null,
        sof: sof || null,
        customer_account,
        callfile: callfile || null,
        user: inputUser || user._id,
        comment: comment || null,
      });

      // Find the customer account to get its bucket
      const customerAccountDoc = await CustomerAccount.findById(customer_account).lean();
      const bucketId = customerAccountDoc?.bucket || null;

      // Find all TLFIELD users who have this bucket assigned
      if (bucketId) {
        const tlfieldUsers = await User.find({
          type: "TLFIELD",
          buckets: bucketId,
        }).lean();

        // Create notifications for each TLFIELD user
        for (const tlUser of tlfieldUsers) {
          await Notification.create({
            user: user._id, // AGENTFIELD who created the disposition
            assignee: tlUser._id, // TLFIELD to be notified
            bucket: bucketId,
            task: 1,
            code: 2, // code 2 for field disposition created
            createdAt: new Date(),
          });
        }
      }


      await CustomerAccount.findByIdAndUpdate(customer_account, {
        $push: { fieldhistory: fieldDisposition._id },
        $set: { fielddisposition: fieldDisposition._id },
      });

      return {
        success: true,
        message: "Field disposition created",
        fieldDisposition,
      };
    }),
    createDisposition: safeResolver(
      async (_, { input }, { user, pubsub, PUBSUB_EVENTS }) => {
        if (!user) throw new CustomError("Unauthorized", 401);
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const findUser = await User.findById(user._id);

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

        if (!userProdRaw) await Production.create({ user: findUser._id });

        const findBucket = await Bucket.findById(customerAccount.bucket);
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
          currentDispo?.user?.toString() === findUser?._id?.toString();
        const isPaidDispo = dispoType?.code === "PAID";
        const isPTPDispo = dispoType?.code === "PTP";

        const payment =
          customerAccount.balance - parseFloat(input.amount || 0) === 0
            ? "full"
            : "partial";

        const newDisposition = new Disposition({
          ...input,
          "features.SOF": input.SOF,
          payment: withPayment.includes(dispoType.code) ? payment : null,
          amount: parseFloat(input.amount) || 0,
          user: findUser._id,
          callId: input.callId,
          "features.partialPayment": input.partialPayment,
          callfile: customerAccount.callfile,
        });

        const group = customerAccount?.assigned
          ? await Group.findById(customerAccount?.assigned).lean()
          : null;
        const assigned = group
          ? group?.members
          : customerAccount?.assigned
            ? [customerAccount.assigned]
            : [];

        await pubsub.publish(PUBSUB_EVENTS.DISPOSITION_UPDATE, {
          dispositionUpdated: {
            members: [...new Set([...assigned, findUser?._id?.toString()])],
            message: "NEW_DISPOSITION",
          },
        });

        const updateFields = {
          "features.alreadyCalled": true,
        };

        const unsetFields = {};

        if (
          isPTPDispo ||
          (currentDispo && isCurrentPTP && dispoType?.status !== 1) ||
          findBucket.isPermanent
        ) {
          updateFields["assigned"] = findUser._id;
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
          customerAccount?.current_disposition?.disposition,
        );

        if (!currentDispotype) {
          updateFields["current_disposition"] = newDisposition?._id;
          newDisposition.existing = true;
        } else if (currentDispotype && dispoType.rank > 0) {
          updateFields["current_disposition"] = newDisposition?._id;
          await Disposition.findByIdAndUpdate(
            customerAccount?.current_disposition,
            { $set: { existing: false } },
          );
          newDisposition.existing = true;
        } else if (currentDispotype.rank === 0 && dispoType.rank === 0) {
          updateFields["current_disposition"] = newDisposition._id;
          newDisposition.existing = true;
          await Disposition.findByIdAndUpdate(
            customerAccount?.current_disposition,
            { $set: { existing: false } },
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
          { new: true },
        );

        return {
          success: true,
          message: "Disposition successfully created",
          dispoId: newDisposition._id,
        };
      },
    ),
    updateCustomerForField: safeResolver(
      async (_, { id, forfield }, { user }) => {
        if (!user) throw new CustomError("Unauthorized", 401);

        try {
          const existingCA = await CustomerAccount.findById(id).lean();
          if (!existingCA) {
            return {
              success: false,
              message: "Customer not found",
              customer: null,
            };
          }

          const updatedCA = await CustomerAccount.findByIdAndUpdate(
            id,
            { $set: { forfield: Boolean(forfield) } },
            { new: true, strict: false },
          ).lean();

          if (!updatedCA) {
            return {
              success: false,
              message: "Failed to update customer account",
              customer: null,
            };
          }

          return {
            success: true,
            message: "Disposition successfully created",
            customer: updatedCA,
          };
        } catch (err) {
          console.error("updateCustomerForField error:", err);
          throw new CustomError(err.message || "Server error", 500);
        }
      },
    ),
    updateFieldAssignee: safeResolver(
      async (_, { id, assignee, task }, { user }) => {
        if (!user) {
          return { success: false, message: "Unauthorized", customer: null };
        }

        try {
          const existingCA = await CustomerAccount.findById(id).lean();
          if (!existingCA) {
            return {
              success: false,
              message: "Customer not found",
              customer: null,
            };
          }

          const assigneeUser = await User.findById(assignee).lean();
          if (!assigneeUser) {
            return {
              success: false,
              message: "Assignee not found",
              customer: null,
            };
          }

          const updatedCA = await CustomerAccount.findByIdAndUpdate(
            id,
            { $set: { fieldassigned: assignee, started: false } },
            { new: true, strict: false },
          ).lean();

          if (!updatedCA) {
            return {
              success: false,
              message: "Failed to update customer account",
              customer: null,
            };
          }

          if (typeof task === "number" && task > 0) {
            try {
              await Notification.create({
                user: user._id,
                assignee,
                bucket: updatedCA?.bucket || existingCA?.bucket || null,
                task,
                code: 1,
                createdAt: new Date(),
              });
            } catch (notifyErr) {
              console.error("create notification error:", notifyErr);
            }
          }

          return {
            success: true,
            message: "Assignee successfully updated",
            customer: updatedCA,
          };
        } catch (err) {
          console.error("updateFieldAssignee error:", err);

          return {
            success: false,
            message: err.message || "Server error",
            customer: null,
          };
        }
      },
    ),
  },
};

export default dispositionResolver;
