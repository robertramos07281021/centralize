import ftp from "basic-ftp";
import mongoose from "mongoose";
import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Disposition from "../../models/disposition.js";
import Production from "../../models/production.js";
import User from "../../models/user.js";
import bcrypt from "bcryptjs";
import DispoType from "../../models/dispoType.js";
import "dotenv/config.js";
import Bucket from "../../models/bucket.js";
import Callfile from "../../models/callfile.js";

const productionResolver = {
  DateTime,
  Query: {
    productions: async () => {
      try {
        const data = await Production.find().lean();
        return data;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    productionByUser: async (_, { userId }) => {
      try {
        const prod = await Production.findOne({ user: userId }).lean();
        return prod;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAgentProductionPerDay: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const year = new Date().getFullYear();
        const month = new Date().getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const disposition = await Disposition.aggregate([
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
              user: user._id,
              createdAt: { $gte: firstDay, $lt: lastDay },
              "dispotype.code": { $in: ["PTP", "PAID"] },
            },
          },
          {
            $group: {
              _id: {
                day: { $dayOfMonth: "$createdAt" },
              },
              ptp_kept: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$ptp", true] },
                        { $eq: ["$dispotype.code", "PAID"] },
                        { $eq: ["$selectivesDispo", true] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              ptp: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$dispotype.code", "PTP"],
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
              date: "$_id.day",
              ptp: 1,
              ptp_kept: 1,
            },
          },
        ]);

        return disposition;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    agentProduction: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endOfMonth.setMilliseconds(-1);

        const dtc = await Disposition.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(user._id),
              createdAt: { $gte: startOfMonth, $lte: endOfMonth },
              selectivesDispo: false,
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
            $unwind: { path: "$pd", preserveNullAndEmptyArrays: true },
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
              from: "dispotypes",
              localField: "pd.disposition",
              foreignField: "_id",
              as: "pd_dispotype",
            },
          },
          {
            $unwind: {
              path: "$pd_dispotype",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "dispotype.code": "PTP",
            },
          },
          {
            $group: {
              _id: null,
              totalAmountPTP: {
                $sum: "$amount",
              },
              totalCountPTP: {
                $sum: 1,
              },
              totalAmountKept: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$dispotype.code", "PAID"] },
                        { $eq: ["$selectivesDispo", true] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              totalCountKept: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$dispotype.code", "PAID"] },
                        { $eq: ["$selectivesDispo", true] },
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
              totalCountPTP: 1,
              totalAmountPTP: 1,
              totalAmountKept: 1,
              totalCountKept: 1,
            },
          },
        ]);

        return dtc[0];
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAgentProductionPerMonth: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const year = new Date().getFullYear();
        const firstMonth = new Date(year, 0, 1);
        const lastMonth = new Date(year, 11, 31, 23, 59, 59, 999);
        const res = await Disposition.aggregate([
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
              user: user._id,
              createdAt: { $gte: firstMonth, $lte: lastMonth },
              "dispotype.code": { $in: ["PAID", "PTP"] },
            },
          },
          {
            $group: {
              _id: {
                month: { $month: "$createdAt" },
              },
              ptp_kept: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$ptp", true],
                        },
                        {
                          $eq: ["$dispotype.code", "PAID"],
                        },
                        {
                          $eq: ["$selectivesDispo", true],
                        },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              ptp: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$dispotype.code", "PTP"],
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
              month: "$_id.month",
              total: 1,
              ptp: 1,
              ptp_kept: 1,
            },
          },
        ]);

        return res;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAgentTotalDispositions: async (_, { from, to }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1);
        firstDay.setHours(0, 0, 0, 0);
        const lastDay = new Date(year, month + 1, 0);
        lastDay.setHours(23, 59, 59, 999);

        const hasCustomRange = Boolean(from || to);
        let startDate = from ? new Date(from) : null;
        let endDate = to ? new Date(to) : null;

        if (startDate) {
          startDate.setHours(0, 0, 0, 0);
        }

        if (endDate) {
          endDate.setHours(23, 59, 59, 999);
        }

        if (hasCustomRange) {
          if (!startDate && endDate) {
            startDate = new Date(endDate);
            startDate.setHours(0, 0, 0, 0);
          }
          if (startDate && !endDate) {
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
          }
        } else {
          startDate = firstDay;
          endDate = lastDay;
        }

        const res = await Disposition.aggregate([
          {
            $match: {
              user: user._id,
              createdAt: { $gte: startDate, $lte: endDate },
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
            $group: {
              _id: "$dispotype._id",
              count: { $sum: 1 },
              latestCreatedAt: { $max: "$createdAt" },
            },
          },
          {
            $project: {
              _id: 0,
              dispotype: "$_id",
              count: 1,
              createdAt: "$latestCreatedAt",
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ]);

        console.log(res);
        return res;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAgentDailyCollection: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const agentCollection = await Disposition.aggregate([
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
            $lookup: {
              from: "dispotypes",
              localField: "pd.disposition",
              foreignField: "_id",
              as: "pd_dispotype",
            },
          },
          {
            $unwind: {
              path: "$pd_dispotype",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              createdAt: { $gte: todayStart, $lt: todayEnd },
              user: { $eq: user._id },
              "dispotype.code": "PTP",
            },
          },
          {
            $project: {
              amount: 1,
              createdAt: 1,
              payment_date: 1,
              ptp: 1,
              existing: 1,
              selectivesDispo: 1,
              code: "$dispotype.code",
              pd: 1,
              pd_code: "$pd_dispotype.code",
            },
          },
          {
            $group: {
              _id: null,
              ptp_amount: {
                $sum: {
                  $cond: [{ $eq: ["$code", "PTP"] }, "$amount", 0],
                },
              },
              ptp_count: {
                $sum: {
                  $cond: [{ $eq: ["$code", "PTP"] }, 1, 0],
                },
              },
              ptp_kept_amount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$code", "PAID"] },
                        { $eq: ["$ptp", true] },
                        { $eq: ["$selectivesDispo", true] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              ptp_kept_count: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$code", "PAID"] },
                        { $eq: ["$ptp", true] },
                        { $eq: ["$selectivesDispo", true] },
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
              ptp_amount: 1,
              ptp_count: 1,
              ptp_kept_amount: 1,
              ptp_kept_count: 1,
            },
          },
        ]);
        return agentCollection[0];
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    ProductionReport: async (_, { dispositions, from, to }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const dispositionFilter =
          dispositions.length > 0
            ? { $in: dispositions.map((e) => new mongoose.Types.ObjectId(e)) }
            : { $ne: null };

        const buildDayRange = (dateValue) => {
          const start = new Date(dateValue);
          start.setHours(0, 0, 0, 0);
          const end = new Date(dateValue);
          end.setHours(23, 59, 59, 999);
          return { start, end };
        };

        let dateFilter = null;
        const hasFrom = Boolean(from);
        const hasTo = Boolean(to);

        if (hasFrom && hasTo) {
          const startRange = new Date(from);
          startRange.setHours(0, 0, 0, 0);
          const endRange = new Date(to);
          endRange.setHours(23, 59, 59, 999);
          if (startRange > endRange) {
            const temp = new Date(startRange);
            startRange.setTime(endRange.getTime());
            endRange.setTime(temp.getTime());
          }
          dateFilter = { $gte: startRange, $lte: endRange };
        } else if (hasFrom || hasTo) {
          const { start, end } = buildDayRange(hasFrom ? from : to);
          dateFilter = { $gte: start, $lte: end };
        }

        const objectMatch = {
          user: new mongoose.Types.ObjectId(user._id),
          disposition: dispositionFilter,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        };

        const filterAllCreatedAt = dateFilter || { $ne: null };

        const totalDisposition = await Disposition.countDocuments({
          user: new mongoose.Types.ObjectId(user._id),
          createdAt: filterAllCreatedAt,
        });

        const userDispostion = await Disposition.aggregate([
          {
            $match: objectMatch,
          },
          {
            $group: {
              _id: "$disposition",
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              dispotype: "$_id",
              count: 1,
            },
          },
          {
            $sort: {
              dispotype: 1,
            },
          },
        ]);

        return {
          totalDisposition,
          dispotypes: userDispostion,
        };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAgentProductions: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const production = await Production.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userInfo",
            },
          },
          {
            $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true },
          },
          {
            $match: {
              "userInfo.departments": {
                $in: user.departments.map(
                  (e) => new mongoose.Types.ObjectId(e)
                ),
              },
              createdAt: { $gte: start, $lt: end },
            },
          },
          {
            $group: {
              _id: {
                _id: "$_id",
                user: "$userInfo._id",
              },
              prod_history: { $first: "$prod_history" },
              createdAt: { $first: "$createdAt" },
              target_today: { $first: "$target_today" },
            },
          },
          {
            $project: {
              _id: "$_id._id",
              user: "$_id.user",
              prod_history: 1,
              createdAt: 1,
              target_today: 1,
            },
          },
        ]);

        return production;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAllAgentProductions: async (_, { bucketId, from, to }) => {
      try {
        if (!bucketId) return null;

        let startOfTheDay = null;
        let endOfTheDay = null;
        if (!from && !to) {
          const start = new Date("11-19-2025");
          start.setHours(0, 0, 0, 0);
          startOfTheDay = start;

          const end = new Date("11-19-2025");

          end.setHours(23, 59, 59, 999);
          endOfTheDay = end;
        } else if ((!from && to) || (!to && from)) {
          const date = to || from;

          const start = new Date(date);
          start.setHours(0, 0, 0, 0);
          startOfTheDay = start;

          const end = new Date(date);

          end.setHours(23, 59, 59, 999);
          endOfTheDay = end;
        }

        const users = (
          await User.find({ buckets: bucketId, type: "AGENT" })
        ).map((x) => new mongoose.Types.ObjectId(x._id));

        const production = await Production.aggregate([
          {
            $match: {
              createdAt: { $gt: startOfTheDay, $lte: endOfTheDay },
              user: { $in: users },
            },
          },
        ]);

        const agentIds = production.map(
          (prod) => new mongoose.Types.ObjectId(prod.user)
        );

        const disposition = await Disposition.aggregate([
          {
            $match: {
              createdAt: { $gt: startOfTheDay, $lte: endOfTheDay },
              user: { $in: agentIds },
              callId: { $exists: true, $ne: "", $ne: null },
            },
          },
          {
            $group: {
              _id: "$user",
              total: { $sum: 1 },
              dispositions: { $push: "$callId" },
            },
          },
        ]);

        const newProduction = production.map(async (prod) => {
          const findUser = disposition.find(
            (x) => x._id.toString() === prod.user.toString()
          );

          if (!findUser) {
            return { ...prod, total: 0, average: 0, longest: 0 };
          }

          const callTimes = findUser.dispositions.map((fileName) => {
            const parts = fileName.split(".mp3_");
            return parts.length > 1 ? Number(parts[1]) : 0;
          });
          const user = await User.findById(findUser._id).filter(
            (x) => !isNaN(x)
          );

          const totalCalls = callTimes.length;
          const average =
            totalCalls > 0
              ? callTimes.reduce((t, v) => t + v, 0) / totalCalls
              : 0;

          const longest = totalCalls > 0 ? Math.max(...callTimes) : 0;

          return { ...prod, user, total: totalCalls, average, longest };
        });

        return newProduction;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAgentDispositionRecords: async (
      _,
      { agentID, limit, page, from, to, search, dispotype, ccsCalls }
    ) => {
      const client = new ftp.Client();

      const skip = (page - 1) * limit;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dialer = ["vici", "issabel"];
      const filtered = {
        user: new mongoose.Types.ObjectId(agentID),
        $or: [
          {
            selectivesDispo: { $eq: false },
          },
          {
            selectivesDispo: { $exists: false },
          },
        ],
        $or: [
          {
            "customer.contact_no": {
              $elemMatch: { $regex: search, $options: "i" },
            },
          },
          {
            "customer.fullName": { $regex: search, $options: "i" },
          },
          {
            dialer: { $regex: search, $options: "i" },
          },
        ],
      };
      if (dispotype.length > 0) {
        filtered["dispotype.code"] = { $in: dispotype };
      }

      if (!dialer.includes(search.toLowerCase())) {
        filtered["dialer"] = { $in: dialer };
      }

      if (from && to) {
        const dateStart = new Date(from);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(to);
        dateEnd.setHours(23, 59, 59, 999);
        filtered["createdAt"] = { $gte: dateStart, $lt: dateEnd };
      } else if (from || to) {
        const dateStart = new Date(from || to);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(from || to);
        dateEnd.setHours(23, 59, 59, 999);
        filtered["createdAt"] = { $gte: dateStart, $lt: dateEnd };
      } else {
        filtered["createdAt"] = { $lt: today };
      }

      if (ccsCalls) {
        const forFiltering = await Disposition.aggregate([
          {
            $match: {
              callId: { $ne: null },
              callId: { $exists: true },
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
            $match: filtered,
          },
          { $sort: { createdAt: -1 } },
          {
            $project: {
              _id: "$_id",
              customer_name: "$customer.fullName",
              payment: 1,
              bucket: 1,
              amount: 1,
              dispotype: "$dispotype.code",
              payment_date: "$payment_date",
              ref_no: 1,
              comment: 1,
              contact_no: "$customer.contact_no",
              createdAt: 1,
              callId: 1,
              dialer: 1,
              user: "$dispo_user",
            },
          },
          {
            $facet: {
              metadata: [
                {
                  $group: {
                    _id: null,
                    total: { $sum: 1 },
                    dispotypeCodes: { $addToSet: "$dispotype" },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    total: 1,
                    dispotypeCodes: 1,
                  },
                },
              ],
              data: [{ $skip: skip }, { $limit: limit }],
            },
          },
        ]);

        const newMapForDispoCode =
          forFiltering[0]?.metadata?.length > 0
            ? forFiltering[0]?.metadata[0]?.dispotypeCodes
            : [];
        const total =
          forFiltering[0]?.metadata?.length > 0
            ? forFiltering[0]?.metadata[0]?.total
            : 0;

        const data =
          forFiltering[0]?.data?.length > 0 ? forFiltering[0]?.data : [];

        return {
          dispositions: data || [],
          dispocodes: newMapForDispoCode,
          total: total,
        };
      } else {
        try {
          const forFiltering = await Disposition.aggregate([
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
              $match: filtered,
            },
            { $sort: { createdAt: -1 } },
            {
              $project: {
                _id: "$_id",
                customer_name: "$customer.fullName",
                payment: 1,
                bucket: 1,
                amount: 1,
                dispotype: "$dispotype.code",
                payment_date: "$payment_date",
                ref_no: 1,
                comment: 1,
                contact_no: "$customer.contact_no",
                createdAt: 1,
                callId: 1,
                dialer: 1,
                user: "$dispo_user",
              },
            },
            {
              $facet: {
                metadata: [
                  {
                    $group: {
                      _id: null,
                      total: { $sum: 1 },
                      dispotypeCodes: { $addToSet: "$dispotype" },
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      total: 1,
                      dispotypeCodes: 1,
                    },
                  },
                ],
                data: [{ $skip: skip }, { $limit: limit }],
              },
            },
          ]);

          await client.access({
            host: process.env.FILEZILLA_HOST,
            user: process.env.FILEZILLA_USER,
            password: process.env.FILEZILLA_PASSWORD,
            port: 21,
            secure: false,
          });

          const withRecordings = [];

          for (const filtered of forFiltering[0]?.data) {
            const months = [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ];

            function checkDate(number) {
              return number > 9 ? number : `0${number}`;
            }

            const createdAt = new Date(filtered?.createdAt);
            const yearCreated = createdAt.getFullYear();
            const monthCreated = months[createdAt.getMonth()];
            const dayCreated = createdAt.getDate();
            const contact = filtered?.contact_no;
            const issabelIpAddress = filtered?.bucket?.issabelIp;
            const month = createdAt.getMonth() + 1;
            const viciIpAddress = filtered?.bucket?.viciIp;

            const fileNale = {
              "172.20.21.64": "AUTODIAL SHOPEE BCL-M7",
              "172.20.21.63": "MIXED CAMPAIGN",
              "172.20.21.10": "MIXED CAMPAIGN NEW 2",
              "172.20.21.17": "PSBANK",
              "172.20.21.27": "MIXED CAMPAIGN",
              "172.20.21.30": "MCC",
              "172.20.21.35": "MIXED CAMPAIGN",
              "172.20.21.67": "MIXED CAMPAIGN NEW",
              "172.20.21.97": "UB",
              "172.20.21.70": "AUTODIAL SHOPEE M3",
              "172.20.21.18": "MIXED CAMPAIGN NEW 2",
              "172.20.21.165": "PAGIBIGNCR",
              "172.20.21.105": "PAGIBIGPAM",
              "172.20.21.91": "AUTODIAL SHOPEE M2",
              "172.20.21.85": "AUTODIAL SHOPEE M4",
              "172.20.21.76": "AUTODIAL SHOPEE BCL-M7",
              "172.20.21.30": "MCC",
              "172.20.21.196": "ATOME NEW",
            };

            const issabelNasFileBane = {
              "172.20.21.57": "ATOME CASH S1-ISSABEL_172.20.21.57",
              "172.20.21.32": "ATOME CASH S2-ISSABEL_172.20.21.32",
              "172.20.21.62": "AVON-ISSABEL_172.20.21.62",
              "172.20.21.72": "CIGNAL-ISSABEL_172.20.21.72",
              "172.20.21.50": "CTBC-ISSABEL_172.20.21.50",
            };

            const remoteDirVici = `/REC-${viciIpAddress}-${
              ![
                "CASH S2",
                "LAZCASH S1",
                "ACS1-TEAM 1",
                "ACS1-TEAM 2",
                "ACS1-TEAM 3",
              ].includes(filtered?.bucket?.name)
                ? fileNale[viciIpAddress]
                : "ATOME"
            }/${yearCreated}-${checkDate(month)}-${checkDate(dayCreated)}`;

            const remoteDirIssabel = `/ISSABEL RECORDINGS/${
              issabelNasFileBane[issabelIpAddress]
            }/${monthCreated + " " + yearCreated}/${checkDate(dayCreated)}`;

            const isShopee =
              [
                "SHOPEE C1 M2",
                "SHOPEE C2 M2",
                "SHOPEE C1 M3",
                "SHOPEE C2 M3",
                "SHOPEE C1 M4",
                "SHOPEE C2 M4",
                "SHOPEE C1 M7",
                "SHOPEE C2 M7",
                "BCL-M2",
                "BCL-M3",
                "BCL-M4",
                "BCL-M7",
              ].includes(filtered?.bucket?.name) &&
              createdAt.getMonth() < 12 &&
              dayCreated < 12
                ? `/REC-${fileNale["172.20.21.35"]}${yearCreated}-${checkDate(
                    month
                  )}-${checkDate(dayCreated)}`
                : remoteDirVici;

            const ifATOME =
              [
                "CASH S2",
                "LAZCASH S1",
                "ACS1-TEAM 1",
                "ACS1-TEAM 2",
                "ACS1-TEAM 3",
              ].includes(filtered?.bucket?.name) &&
              createdAt.getMonth() < 7 &&
              dayCreated < 18
                ? `/REC-172.20.21.18-MIXED CAMPAIGN NEW 2/${yearCreated}-${checkDate(
                    month
                  )}-${checkDate(dayCreated)}`
                : isShopee;

            const remoteDir =
              filtered.dialer === "vici" ? ifATOME : remoteDirIssabel;

            try {
              const files = await client.list(remoteDir);
              const userRecordings = [];

              const patterns = (contact ?? []).map((number) => {
                const digits = number.replace(/\D/g, "");

                // Normalize: remove leading 0 or 63 for consistency
                const normalized = digits.replace(/^(0|63)/, "");

                // Create a regex that matches possible formats: 0XXXXXXXXXX, 63XXXXXXXXXX, or XXXXXXXXXX
                return new RegExp(`(0|63)?${normalized}`);
              });

              const matches = files
                .filter((fileInfo) =>
                  patterns.some((rx) => rx.test(fileInfo.name))
                )
                .map((fileInfo) => ({
                  name: fileInfo.name,
                  size: fileInfo.size,
                }));

              function getClosestFile(files, createdAt) {
                let closest = null;
                let smallestDiff = Infinity;

                for (const file of files) {
                  const parts = file.name.split("-");
                  const dateStr = parts[3];
                  const timeStr = parts[4];

                  const year = dateStr.slice(0, 4);
                  const month = dateStr.slice(4, 6);
                  const day = dateStr.slice(6, 8);

                  const hour = timeStr.slice(0, 2);
                  const minute = timeStr.slice(2, 4);
                  const second = timeStr.slice(4, 6);

                  const fileDate = new Date(
                    `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
                  );

                  const diff = Math.abs(
                    fileDate.getTime() - createdAt.getTime()
                  );

                  if (diff < smallestDiff) {
                    smallestDiff = diff;
                    closest = file;
                  }
                }

                return closest;
              }

              if (filtered.dialer === "vici") {
                for (const file of matches) {
                  if (file.name.includes(`_${filtered?.user?.vici_id}_`)) {
                    userRecordings.push(file);
                  }
                }
              } else {
                if (getClosestFile(matches, createdAt) !== null) {
                  userRecordings.push(getClosestFile(matches, createdAt));
                }
              }
              withRecordings.push({ ...filtered, recordings: userRecordings });
            } catch (err) {
              withRecordings.push({ ...filtered });
              continue;
            }
          }
          const newMapForDispoCode =
            forFiltering[0]?.metadata?.length > 0
              ? forFiltering[0]?.metadata[0]?.dispotypeCodes
              : [];
          const total =
            forFiltering[0]?.metadata?.length > 0
              ? forFiltering[0]?.metadata[0]?.total
              : 0;

          return {
            dispositions: withRecordings || [],
            dispocodes: newMapForDispoCode,
            total: total,
          };
        } catch (error) {
          console.log(error);
          throw new CustomError(error.message, 500);
        } finally {
          client.close();
        }
      }
    },
    checkAgentIfHaveProd: async (_, { bucket, interval }) => {
      try {
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

        const disposition = await Disposition.aggregate([
          {
            $match: filter,
          },
          {
            $group: {
              _id: "$user",
            },
          },
          {
            $project: {
              _id: 0,
              users: "$_id",
            },
          },
        ]);

        // console.log(disposition)
        return disposition.map(x=> x.users);
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    monthlyWeeklyCollected: async (_, __, { user }) => {
      try {
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

        const findDisposition = await Disposition.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(user._id),
              createdAt: { $gte: startOfMonth, $lte: endOfMonth },
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
            },
          },
          {
            $group: {
              _id: 0,
              monthly: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$ptp", true],
                        },
                        {
                          $eq: ["$selectivesDispo", true],
                        },
                        {
                          $gte: ["$createdAt", startOfMonth],
                        },
                        {
                          $lte: ["$createdAt", endOfMonth],
                        },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              monthlyCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$ptp", true],
                        },
                        {
                          $eq: ["$selectivesDispo", true],
                        },
                        {
                          $gte: ["$createdAt", startOfMonth],
                        },
                        {
                          $lte: ["$createdAt", endOfMonth],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              weekly: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$ptp", true],
                        },
                        {
                          $eq: ["$selectivesDispo", true],
                        },
                        {
                          $gte: ["$createdAt", startOfWeek],
                        },
                        {
                          $lte: ["$createdAt", endOfWeek],
                        },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              weeklyCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: ["$ptp", true],
                        },
                        {
                          $eq: ["$selectivesDispo", true],
                        },
                        {
                          $gte: ["$createdAt", startOfWeek],
                        },
                        {
                          $lte: ["$createdAt", endOfWeek],
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
              monthly: 1,
              weekly: 1,
              weeklyCount: 1,
              monthlyCount: 1,
            },
          },
        ]);

        const res = findDisposition[0] || {
          monthly: 0,
          weekly: 0,
          weeklyCount: 0,
          monthlyCount: 0,
        };

        return res;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    getAgentRPCCount: async (_, __, { user }) => {
      try {
        const now = new Date();
        const startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endOfMonth.setMilliseconds(-1);

        const rpcCount = ["PTP", "PAID", "UNEG", "DISP", "RTP", "FFUP"];

        const RPCCustomerAccount = await Disposition.aggregate([
          {
            $match: {
              user: new mongoose.Types.ObjectId(user._id),
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
              createdAt: { $gt: startOfMonth, $lte: endOfMonth },
            },
          },
          {
            $group: {
              _id: "$ca.case_id",
              dailyCount: {
                $max: {
                  $cond: [
                    {
                      $and: [
                        { $gt: ["$createdAt", startDate] },
                        { $lte: ["$createdAt", endDate] },
                        { $eq: ["$customer.isRPC", true] },
                        {
                          $or: [
                            {
                              $and: [
                                { $ne: ["$dispotype.code", "PTP"] },
                                { $ne: ["$dispotype.code", "PAID"] },
                              ],
                            },
                            {
                              $and: [
                                { $eq: ["$dispotype.code", "PTP"] },
                                { $ne: [{ $type: "$paidDispo" }, "objectId"] },
                              ],
                            },
                            {
                              $and: [
                                { $eq: ["$dispotype.code", "PTP"] },
                                { $eq: ["$pd.selectivesDispo", true] },
                              ],
                            },
                            {
                              $and: [
                                { $eq: ["$dispotype.code", "PAID"] },
                                { $eq: ["$selectivesDispo", false] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              totalCount: {
                $max: {
                  $cond: [
                    {
                      $and: [
                        { $gt: ["$createdAt", startOfMonth] },
                        { $lte: ["$createdAt", endOfMonth] },
                        { $eq: ["$customer.isRPC", true] },
                        {
                          $or: [
                            {
                              $and: [
                                { $ne: ["$dispotype.code", "PTP"] },
                                { $ne: ["$dispotype.code", "PAID"] },
                              ],
                            },
                            {
                              $and: [
                                { $eq: ["$dispotype.code", "PTP"] },
                                { $ne: [{ $type: "$paidDispo" }, "objectId"] },
                              ],
                            },
                            {
                              $and: [
                                { $eq: ["$dispotype.code", "PTP"] },
                                { $eq: ["$pd.selectivesDispo", true] },
                              ],
                            },
                            {
                              $and: [
                                { $eq: ["$dispotype.code", "PAID"] },
                                { $eq: ["$selectivesDispo", false] },
                              ],
                            },
                          ],
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
            $group: {
              _id: null,
              dailyCount: { $sum: "$dailyCount" },
              totalCount: { $sum: "$totalCount" },
            },
          },
          {
            $project: {
              _id: 0,
              dailyCount: 1,
              totalCount: 1,
            },
          },
        ]);

        return RPCCustomerAccount[0];
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
  },
  DipotypeCount: {
    dispotype: async (parent) => {
      try {
        const dispotypes = await DispoType.findById(parent.dispotype);
        return dispotypes;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
  Mutation: {
    setTargets: async (_, { userId, targets }) => {
      try {
        const { daily, weekly, monthly } = targets;
        const findUser = await User.findByIdAndUpdate(userId, {
          $set: {
            targets: {
              daily: Number(daily),
              weekly: Number(weekly),
              monthly: Number(monthly),
            },
          },
        });
        if (!findUser) {
          throw new CustomError("User not found", 404);
        }
        return {
          success: true,
          message: "Target successfully updated",
        };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    updateProduction: async (_, { type }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const updateProduction = await Production.findOne({
          $and: [
            {
              user: user._id,
            },
            {
              createdAt: { $gte: start, $lt: end },
            },
          ],
        });

        if (!updateProduction) {
          throw new CustomError("Production not found");
        }

        updateProduction.prod_history = updateProduction.prod_history.map(
          (entry) => {
            if (entry.existing === true) {
              return {
                ...entry,
                existing: false,
                end: new Date(),
              };
            }
            return entry;
          }
        );

        const newStart = new Date();

        updateProduction.prod_history.push({
          type,
          start: newStart,
          existing: true,
        });

        await updateProduction.save();

        return {
          success: true,
          message: "Production successfully updated",
          start: newStart,
        };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    loginToProd: async (_, { password }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const findUser = await User.findById(user._id);

        const validatePassword = await bcrypt.compare(password, user.password);
        if (!validatePassword) throw new CustomError("Incorrect");

        return {
          success: validatePassword,
          message: "Successfully login",
        };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    setBucketTargets: async (_, { bucketId, targets }) => {
      try {
        const { daily, weekly, monthly } = targets;

        await User.updateMany(
          {
            $and: [
              {
                buckets: new mongoose.Types.ObjectId(bucketId),
              },
              {
                type: { $eq: "AGENT" },
              },
            ],
          },
          {
            $set: {
              targets: {
                daily: Number(daily),
                weekly: Number(weekly),
                monthly: Number(monthly),
              },
            },
          }
        );

        return {
          success: true,
          message: "Targets successfully updated",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    lockAgent: async (_, __, { user, pubsub, PUBSUB_EVENTS }) => {
      try {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const lockUser = await User.findByIdAndUpdate(user._id, {
          $set: { isLock: true },
        });

        if (!lockUser) throw new CustomError("User not found", 404);

        const addproduction = await Production.findOne({
          $and: [
            { user: new mongoose.Types.ObjectId(user._id) },
            { createdAt: { $gte: startDate, $lt: endDate } },
          ],
        });

        addproduction.prod_history.push({
          type: "LOCK",
          existing: false,
          start: new Date(),
        });

        await addproduction.save();

        await pubsub.publish(PUBSUB_EVENTS.AGENT_LOCK, {
          agentLocked: {
            agentId: lockUser._id,
            message: PUBSUB_EVENTS.AGENT_LOCK,
          },
        });

        return {
          success: true,
          message: "Account lock",
        };
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
  },
};

export default productionResolver;
