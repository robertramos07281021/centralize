import "dotenv/config.js";
import mongoose from "mongoose";
import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Callfile from "../../models/callfile.js";
import CustomerAccount from "../../models/customerAccount.js";
// import { json2csv } from 'json-2-csv';
import Department from "../../models/department.js";
import DispoType from "../../models/dispoType.js";
import Bucket from "../../models/bucket.js";
import Disposition from "../../models/disposition.js";
import Selective from "../../models/selective.js";
import User from "../../models/user.js";
import fs from "fs";
import path from "path";

const callfileResolver = {
  DateTime,
  Query: {
    getCallfiles: async (_, { bucket, limit, page, status }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const active =
          status !== "all" || !status ? status === "active" : { $ne: null };
        const skip = (page - 1) * limit;
        const result = await Callfile.aggregate([
          {
            $match: {
              bucket: { $eq: new mongoose.Types.ObjectId(bucket) },
              active: active,
            },
          },
          {
            $facet: {
              count: [
                {
                  $count: "total",
                },
              ],
              data: [
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit },
              ],
            },
          },
        ]);

        const total = result[0].count[0]?.total || 0;
        const files = result[0].data || [];
        const connectedDispo = [
          "PTP",
          "FFUP",
          "UNEG",
          "RTP",
          "PAID",
          "DISP",
          "ANSM",
          "UNK",
          "LM",
          "HUP",
          "DEC",
          "BUSY",
          "NOA",
          "NIS",
          "OCA",
          "KOR",
        ];

        const paidDispo = await DispoType.findOne({ code: "PAID" });

        const customerAccounts = (
          await Promise.all(
            files.map((e) =>
              CustomerAccount.aggregate([
                {
                  $match: {
                    callfile: new mongoose.Types.ObjectId(e._id),
                  },
                },
                {
                  $lookup: {
                    from: "dispositions",
                    localField: "current_disposition",
                    foreignField: "_id",
                    as: "currentDispo",
                  },
                },
                {
                  $unwind: {
                    path: "$currentDispo",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $lookup: {
                    from: "dispotypes",
                    localField: "currentDispo.disposition",
                    foreignField: "_id",
                    as: "dispotype",
                  },
                },
                {
                  $unwind: {
                    path: "$dispotype",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $lookup: {
                    from: "customers",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customerInfo",
                  },
                },
                {
                  $unwind: {
                    path: "$customerInfo",
                    preserveNullAndEmptyArrays: true,
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
                    amount: {
                      $sum: {
                        $map: {
                          input: {
                            $filter: {
                              input: "$histories",
                              as: "history",
                              cond: {
                                $and: [
                                  {
                                    $eq: [
                                      "$$history.disposition",
                                      paidDispo?._id || null,
                                    ],
                                  },
                                  { $eq: ["$$history.selectivesDispo", true] },
                                ],
                              },
                            },
                          },
                          as: "h",
                          in: "$$h.amount",
                        },
                      },
                    },

                    hasValidEmail: {
                      $anyElementTrue: {
                        $map: {
                          input: { $ifNull: ["$customerInfo.emails", []] },
                          as: "email",
                          in: {
                            $regexMatch: {
                              input: { $toString: "$$email" },
                              regex: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
                              options: "i",
                            },
                          },
                        },
                      },
                    },

                    hasValidMobile: {
                      $anyElementTrue: {
                        $map: {
                          input: { $ifNull: ["$customer_info.contact_no", []] },
                          as: "num",
                          in: {
                            $or: [
                              {
                                $regexMatch: {
                                  input: { $toString: "$$num" },
                                  regex: "^02\\d{8}$",
                                },
                              },
                              {
                                $regexMatch: {
                                  input: {
                                    $toString: {
                                      $ifNull: [
                                        "$emergency_contact.mobile",
                                        "",
                                      ],
                                    },
                                  },
                                  regex: "^(08822|08842)\\d{5}$",
                                },
                              },
                              {
                                $regexMatch: {
                                  input: { $toString: "$$num" },
                                  regex:
                                    "^(03[2-8]|04[2-9]|05[2-6]|06[2-8]|07[2-8]|08[2-8])\\d{7}$",
                                },
                              },
                              {
                                $regexMatch: {
                                  input: { $toString: "$$num" },
                                  regex: "^09\\d{9}$",
                                },
                              },
                              {
                                $regexMatch: {
                                  input: { $toString: "$$num" },
                                  regex: "^9\\d{9}$",
                                },
                              },
                              {
                                $regexMatch: {
                                  input: { $toString: "$$num" },
                                  regex: "^639\\d{9}$",
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                    hasValidEmergencyContact: {
                      $cond: [
                        {
                          $or: [
                            {
                              $regexMatch: {
                                input: {
                                  $toString: {
                                    $ifNull: ["$emergency_contact.mobile", ""],
                                  },
                                },
                                regex: "^02\\d{8}$",
                              },
                            },
                            {
                              $regexMatch: {
                                input: {
                                  $toString: {
                                    $ifNull: ["$emergency_contact.mobile", ""],
                                  },
                                },
                                regex: "^(08822|08842)\\d{5}$",
                              },
                            },
                            {
                              $regexMatch: {
                                input: {
                                  $toString: {
                                    $ifNull: ["$emergency_contact.mobile", ""],
                                  },
                                },
                                regex:
                                  "^(03[2-8]|04[2-9]|05[2-6]|06[2-8]|07[2-8]|08[2-8])\\d{7}$",
                              },
                            },
                            {
                              $regexMatch: {
                                input: {
                                  $toString: {
                                    $ifNull: ["$emergency_contact.mobile", ""],
                                  },
                                },
                                regex: "^09\\d{9}$",
                              },
                            },
                          ],
                        },
                        true,
                        false,
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: "$callfile",
                    accounts: {
                      $sum: 1,
                    },
                    uncontactable: {
                      $sum: {
                        $cond: [
                          {
                            $and: [
                              {
                                $eq: ["$hasValidEmail", false],
                              },
                              {
                                $eq: ["$hasValidMobile", false],
                              },
                              {
                                $eq: ["$hasValidEmergencyContact", false],
                              },
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                    connected: {
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
                    OB: {
                      $sum: "$out_standing_details.total_os",
                    },
                    principal: {
                      $sum: "$out_standing_details.principal_os",
                    },

                    collected: {
                      $sum: "$amount",
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    callfile: "$_id",
                    uncontactable: 1,
                    accounts: 1,
                    connected: 1,
                    principal: 1,
                    OB: 1,
                    collected: 1,
                  },
                },
              ])
            )
          )
        ).flat();

        const newCustomerAccounts = customerAccounts.map((x) => {
          const match = files.find(
            (y) => y._id.toString() === x.callfile.toString()
          );
          return {
            ...x,
            target: match.target ?? 0,
          };
        });

        return {
          result: newCustomerAccounts,
          count: total | 0,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    getBucketCallfile: async (_, { bucketId }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const filter =
          bucketId.length > 0
            ? {
                bucket: {
                  $in: bucketId.map((x) => new mongoose.Types.ObjectId(x)),
                },
              }
            : {
                bucket: {
                  $in: user.buckets.map((x) => new mongoose.Types.ObjectId(x)),
                },
              };

        const findActiveCallfile = await Callfile.aggregate([
          {
            $match: filter,
          },
          {
            $sort: { active: -1 },
          },
        ]);
        return findActiveCallfile;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    getBucketActiveCallfile: async (_, { bucketIds }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const requestedBucketIds = Array.isArray(bucketIds) ? bucketIds : [];
        const userBucketIds = (user?.buckets ?? []).map((id) => String(id));

        const allowed = requestedBucketIds.length
          ? requestedBucketIds.filter((id) => userBucketIds.includes(String(id)))
          : userBucketIds;

        if (allowed.length === 0) return [];

        const filter = {
          active: true,
          bucket: {
            $in: allowed.map((id) => new mongoose.Types.ObjectId(id)),
          },
        };

        return await Callfile.find(filter).sort({ createdAt: -1 }).lean();
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    getCallfileDispositions: async (
      _,
      { callfileId, dateFrom, dateTo },
      { user }
    ) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        if (!mongoose.Types.ObjectId.isValid(callfileId)) {
          throw new CustomError("Invalid callfile id", 400);
        }

        const matchFilters = {
          callfile: new mongoose.Types.ObjectId(callfileId),
        };

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (Number.isNaN(fromDate.getTime())) {
            throw new CustomError("Invalid dateFrom", 400);
          }
          matchFilters.createdAt = {
            ...(matchFilters.createdAt || {}),
            $gte: fromDate,
          };
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          if (Number.isNaN(toDate.getTime())) {
            throw new CustomError("Invalid dateTo", 400);
          }
          toDate.setHours(23, 59, 59, 999);
          matchFilters.createdAt = {
            ...(matchFilters.createdAt || {}),
            $lte: toDate,
          };
        }

        const dispositions = await Disposition.aggregate([
          {
            $match: {
              ...matchFilters,
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispoType",
            },
          },
          {
            $unwind: {
              path: "$dispoType",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: {
                code: "$dispoType.code",
                name: "$dispoType.name",
              },
              count: { $sum: 1 },
              amount: {
                $sum: {
                  $cond: [{ $ifNull: ["$amount", false] }, "$amount", 0],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              code: "$_id.code",
              name: "$_id.name",
              count: 1,
              amount: 1,
            },
          },
          {
            $sort: {
              count: -1,
              code: 1,
            },
          },
        ]);

        return dispositions;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    getAgentCallfileDispositions: async (
      _,
      { agentId, bucketId, callfileId, dateFrom, dateTo },
      { user }
    ) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        if (!mongoose.Types.ObjectId.isValid(agentId)) {
          throw new CustomError("Invalid agent id", 400);
        }

        const matchFilters = {
          user: new mongoose.Types.ObjectId(agentId),
        };

        if (callfileId) {
          if (!mongoose.Types.ObjectId.isValid(callfileId)) {
            throw new CustomError("Invalid callfile id", 400);
          }
          matchFilters.callfile = new mongoose.Types.ObjectId(callfileId);
        } else if (bucketId) {
          if (!mongoose.Types.ObjectId.isValid(bucketId)) {
            throw new CustomError("Invalid bucket id", 400);
          }

          const bucketCallfiles = await Callfile.find({
            bucket: new mongoose.Types.ObjectId(bucketId),
          }).select("_id");

          if (!bucketCallfiles.length) {
            return [];
          }

          matchFilters.callfile = {
            $in: bucketCallfiles.map((cf) => cf._id),
          };
        } else {
          const validBuckets = (user.buckets ?? []).filter((id) =>
            mongoose.Types.ObjectId.isValid(id)
          );

          if (!validBuckets.length) {
            return [];
          }

          matchFilters.bucket = {
            $in: validBuckets.map((id) => new mongoose.Types.ObjectId(id)),
          };
        }

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (Number.isNaN(fromDate.getTime())) {
            throw new CustomError("Invalid dateFrom", 400);
          }
          matchFilters.createdAt = {
            ...(matchFilters.createdAt || {}),
            $gte: fromDate,
          };
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          if (Number.isNaN(toDate.getTime())) {
            throw new CustomError("Invalid dateTo", 400);
          }
          toDate.setHours(23, 59, 59, 999);
          matchFilters.createdAt = {
            ...(matchFilters.createdAt || {}),
            $lte: toDate,
          };
        }

        const dispositions = await Disposition.aggregate([
          {
            $match: {
              ...matchFilters,
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispoType",
            },
          },
          {
            $unwind: {
              path: "$dispoType",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: {
                code: "$dispoType.code",
                name: "$dispoType.name",
              },
              count: { $sum: 1 },
              amount: {
                $sum: {
                  $cond: [{ $ifNull: ["$amount", false] }, "$amount", 0],
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              code: "$_id.code",
              name: "$_id.name",
              count: 1,
              amount: 1,
            },
          },
          {
            $sort: {
              count: -1,
              code: 1,
            },
          },
        ]);

        return dispositions;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    downloadCallfiles: async (_, { callfile }) => {
      try {
        const findCallfile = await Callfile.findById(callfile).lean();

        if (!findCallfile) return null;

        const disposition = await DispoType.find({ active: true });

        const newMap = () => {
          return Object.fromEntries(disposition.map((x) => [x._id, x.code]));
        };

        const dispotypeMap = newMap();

        const customersCursor = CustomerAccount.aggregate([
          {
            $match: {
              callfile: new mongoose.Types.ObjectId(findCallfile._id),
            },
          },
          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "currentDispo",
            },
          },
          {
            $unwind: {
              path: "$currentDispo",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "currentDispo.user",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "currentDispo.disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "accountBucket",
            },
          },
          {
            $unwind: {
              path: "$accountBucket",
              preserveNullAndEmptyArrays: true,
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
              from: "dispositions",
              localField: "history",
              foreignField: "_id",
              as: "histories",
            },
          },
          {
            $addFields: {
              newHistories: {
                $filter: {
                  input: "$histories",
                  as: "h",
                  cond: {
                    $and: [
                      { $ne: ["$$h.callId", null] }, // not null
                      { $ne: ["$$h.callId", ""] }, // not empty string
                      { $ne: ["$$h.callId", undefined] },
                    ],
                  },
                },
              },
            },
          },
          {
            $addFields: {
              contact1: {
                $cond: {
                  if: {
                    $gte: [
                      { $size: { $ifNull: ["$customer_info.contact_no", []] } },
                      1,
                    ],
                  },
                  then: { $arrayElemAt: ["$customer_info.contact_no", 0] },
                  else: "",
                },
              },
              contact2: {
                $cond: {
                  if: {
                    $gte: [
                      { $size: { $ifNull: ["$customer_info.contact_no", []] } },
                      2,
                    ],
                  },
                  then: { $arrayElemAt: ["$customer_info.contact_no", 1] },
                  else: "",
                },
              },

              contact3: {
                $cond: {
                  if: {
                    $gte: [
                      { $size: { $ifNull: ["$customer_info.contact_no", []] } },
                      3,
                    ],
                  },
                  then: { $arrayElemAt: ["$customer_info.contact_no", 2] },
                  else: "",
                },
              },
            },
          },
          {
            $addFields: {
              email1: {
                $cond: {
                  if: {
                    $gte: [
                      { $size: { $ifNull: ["$customer_info.emails", []] } },
                      1,
                    ],
                  },
                  then: { $arrayElemAt: ["$customer_info.emails", 0] },
                  else: "",
                },
              },
              email2: {
                $cond: {
                  if: {
                    $gte: [
                      { $size: { $ifNull: ["$customer_info.emails", []] } },
                      2,
                    ],
                  },
                  then: { $arrayElemAt: ["$customer_info.emails", 1] },
                  else: "",
                },
              },

              email3: {
                $cond: {
                  if: {
                    $gte: [
                      { $size: { $ifNull: ["$customer_info.emails", []] } },
                      3,
                    ],
                  },
                  then: { $arrayElemAt: ["$customer_info.emails", 2] },
                  else: "",
                },
              },
            },
          },
          {
            $addFields: {
              address1: {
                $cond: {
                  if: {
                    $gte: [
                      { $size: { $ifNull: ["$customer_info.addresses", []] } },
                      1,
                    ],
                  },
                  then: { $arrayElemAt: ["$customer_info.addresses", 0] },
                  else: "",
                },
              },
              address2: {
                $cond: {
                  if: {
                    $gte: [
                      { $size: { $ifNull: ["$customer_info.addresses", []] } },
                      2,
                    ],
                  },
                  then: { $arrayElemAt: ["$customer_info.addresses", 1] },
                  else: "",
                },
              },

              address3: {
                $cond: {
                  if: {
                    $gte: [
                      { $size: { $ifNull: ["$customer_info.addresses", []] } },
                      3,
                    ],
                  },
                  then: { $arrayElemAt: ["$customer_info.addresses", 2] },
                  else: "",
                },
              },
            },
          },
          {
            $addFields: {
              hasValidMobile: {
                $anyElementTrue: {
                  $map: {
                    input: { $ifNull: ["$customer_info.contact_no", []] },
                    as: "num",
                    in: {
                      $or: [
                        {
                          $regexMatch: {
                            input: { $toString: "$$num" },
                            regex: "^02\\d{8}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: { $toString: "$$num" },
                            regex: "^2\\d{8}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: { $toString: "$$num" },
                            regex: "^632\\d{8}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: {
                              $toString: {
                                $ifNull: ["$emergency_contact.mobile", ""],
                              },
                            },
                            regex: "^(08822|08842)\\d{5}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: {
                              $toString: {
                                $ifNull: ["$emergency_contact.mobile", ""],
                              },
                            },
                            regex: "^(8822|8842)\\d{5}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: {
                              $toString: {
                                $ifNull: ["$emergency_contact.mobile", ""],
                              },
                            },
                            regex: "^(638822|638842)\\d{5}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: { $toString: "$$num" },
                            regex:
                              "^(03[2-8]|04[2-9]|05[2-6]|06[2-8]|07[2-8]|08[2-8])\\d{7}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: { $toString: "$$num" },
                            regex:
                              "^(3[2-8]|4[2-9]|5[2-6]|6[2-8]|7[2-8]|8[2-8])\\d{7}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: { $toString: "$$num" },
                            regex:
                              "^(633[2-8]|634[2-9]|635[2-6]|636[2-8]|637[2-8]|638[2-8])\\d{7}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: { $toString: "$$num" },
                            regex: "^09\\d{9}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: { $toString: "$$num" },
                            regex: "^9\\d{9}$",
                          },
                        },
                        {
                          $regexMatch: {
                            input: { $toString: "$$num" },
                            regex: "^639\\d{9}$",
                          },
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
              hasValidEmail: {
                $anyElementTrue: {
                  $map: {
                    input: { $ifNull: ["$customer_info.emails", []] },
                    as: "email",
                    in: {
                      $regexMatch: {
                        input: { $toString: "$$email" },
                        regex: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
                        options: "i",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $addFields: {
              hasCurrentDispo: {
                $cond: {
                  if: { $ne: ["$currentDispo", null] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              _id: 0,
              contact1: "$contact1",
              contact2: "$contact2",
              contact3: "$contact3",
              isRPC: "$customer_info.isRPC",
              fullname: "$customer_info.fullName",
              email1: {
                $ifNull: ["$email", ""],
              },
              account_bucket: "$accountBucket",
              email2: "$email2",
              email3: "$email3",
              max_dpd: "$max_dpd",
              dpd: "$dpd",
              gender: "$customer_info.gender",
              address1: "$address1",
              address2: "$address2",
              address3: "$address3",
              dob: "$customer_info.dob",
              customer: "$customer_info",
              collector_sip: "$user.user_id",
              collector: "$user.name",
              outstanding_balance: "$out_standing_details.total_os",
              endorsement_date: "$endorsement_date",
              amount_paid: "$paid_amount",
              principal: "$out_standing_details.principal_os",
              amount: "$currentDispo.amount",
              balance: "$balance",
              partial_payment_w_service_fee:
                "$out_standing_details.partial_payment_w_service_fee",
              year: "$out_standing_details.year",
              brand: "$out_standing_details.brand",
              model: "$out_standing_details.model",
              last_payment_amount: "$out_standing_details.last_payment_amount",
              last_payment_date: "$out_standing_details.last_payment_date",
              term: "$out_standing_details.term",
              paid: "$out_standing_details.paid",
              product: "$out_standing_details.product",
              rem_months: "$out_standing_details.rem_months",
              new_tad_with_sf: "$out_standing_details.new_tad_with_sf",
              new_pay_off: "$out_standing_details.new_pay_off",
              service_fee: "$out_standing_details.service_fee",
              dialer: "$currentDispo.dialer",
              chatApp: "$currentDispo.chatApp",
              sms: "$currentDispo.sms",
              selectives: "$currentDispo.selectivesDispo",
              dispo_date: "$currentDispo.createdAt",
              SOF: "$currentDispo.features.SOF",
              RFD: "$currentDispo.RFD",
              case_id: "$case_id",
              platform_user_id: "$customer_info.platform_customer_id",
              emergencyContactName: "$emergency_contact.name",
              emergencyContactMobile: "$emergency_contact.mobile",
              payment: {
                $cond: {
                  if: {
                    $eq: ["$hasCurrentDispo", true],
                  },
                  then: "$currentDispo.payment",
                  else: "",
                },
              },
              payment_date: {
                $cond: {
                  if: {
                    $eq: ["$hasCurrentDispo", true],
                  },
                  then: "$currentDispo.payment_date",
                  else: "",
                },
              },
              payment_method: {
                $cond: {
                  if: {
                    $eq: ["$hasCurrentDispo", true],
                  },
                  then: "$currentDispo.payment_method",
                  else: "",
                },
              },
              contact_method: {
                $cond: {
                  if: {
                    $eq: ["$hasCurrentDispo", true],
                  },
                  then: "$currentDispo.contact_method",
                  else: "",
                },
              },
              comment: {
                $cond: {
                  if: {
                    $eq: ["$hasCurrentDispo", true],
                  },
                  then: "$currentDispo.comment",
                  else: "",
                },
              },
              currentDispo: {
                $cond: {
                  if: {
                    $eq: ["$hasCurrentDispo", true],
                  },
                  then: "$currentDispo",
                  else: "",
                },
              },
              disposition: {
                $cond: {
                  if: {
                    $eq: ["$hasCurrentDispo", true],
                  },
                  then: "$dispotype.name",
                  else: "",
                },
              },
              contactable: {
                $cond: {
                  if: {
                    $or: [
                      {
                        $eq: ["$hasValidEmail", true],
                      },
                      {
                        $eq: ["$hasValidMobile", true],
                      },
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
              call_penetration: "$newHistories",
            },
          },
        ]);

        const cursor = customersCursor
          .allowDiskUse(true)
          .cursor({ batchSize: 10000 });

        function formatDateTime(date) {
          if (!date) return "";
          const d = new Date(date);

          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];

          const month = monthNames[d.getMonth()];
          const day = d.getDate();
          const year = d.getFullYear();

          let hours = d.getHours();
          const minutes = d.getMinutes().toString().padStart(2, "0");
          const ampm = hours >= 12 ? "PM" : "AM";
          hours = hours % 12;
          hours = hours ? hours : 12; // 0 should be 12

          return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
        }

        function formatDateTimeForPenetration(date) {
          if (!date) return "";
          const newdate = date.slice(0, 8); // 20251119
          const time = date.slice(9); // 165925

          const year = newdate.slice(0, 4);
          const month = newdate.slice(4, 6);
          const day = newdate.slice(6, 8);

          let hour = parseInt(time.slice(0, 2), 10);
          const minute = time.slice(2, 4);
          const second = time.slice(4, 6);

          // Convert to AM/PM
          const ampm = hour >= 12 ? "PM" : "AM";
          hour = hour % 12 || 12;

          const formatted = `${year}-${month}-${day} ${hour}:${minute}:${second} ${ampm}`;

          return formatted;
        }

        function formatDuration(value) {
          // Remove any spaces and normalize
          const v = (value || "").trim();

          // If not digits → invalid
          if (!/^\d+$/.test(v)) return "";

          const seconds = parseInt(v, 10); // convert safely
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;

          return `${mins}:${secs.toString().padStart(2, "0")}`;
        }

        const headers = [
          "contact1",
          "contact2",
          "contact3",
          "isRPC",
          "case_id",
          "dpd",
          "max_dpd",
          "fullname",
          "email1",
          "email2",
          "email3",
          "gender",
          "address1",
          "address2",
          "address3",
          "dob",
          "emergencyContactName",
          "emergencyContactMobile",
          "collector_sip",
          "collector",
          "outstanding_balance",
          "amount_paid",
          "amount",
          "principal",
          "balance",
          "payment",
          "payment_date",
          "payment_method",
          "contact_method",
          "comment",
          "disposition",
          "selectives",
          "RFD",
          "SOF",
          "endorsement_date",
          "contactable",
          "dialer",
          "dispo_date",
          "chatApp",
          "sms",
          "partial_payment_w_service_fee",
          "new_tad_with_sf",
          "new_pay_off",
          "service_fee",
          "year",
          "brand",
          "model",
          "last_payment_amount",
          "last_payment_date",
          "call_penetration",
          "call_penetration_count",
          "term",
          "paid",
          "product",
          "rem_months",
        ];

        const formatCustomerRow = (c) => {
          const callPenetration = (c.call_penetration || [])
            .map((x) => {
              if (!x.callId) return "";

              const parts = x.callId.split("_");
              const dateSegment = parts[1];
              const durationSegment = parts[parts.length - 1];

              const dateTime = dateSegment
                ? formatDateTimeForPenetration(dateSegment)
                : "";

              return `${
                dispotypeMap[x.disposition]
              }-${dateTime}-${formatDuration(durationSegment)}\n`;
            })
            .filter(Boolean);

          return {
            ...c,
            contact1: c.contact1 ? `="${c.contact1}"` : "",
            contact2: c.contact2 ? `="${c.contact2}"` : "",
            contact3: c.contact3 ? `="${c.contact3}"` : "",
            call_penetration: callPenetration.length
              ? `="${callPenetration.toString()}"`
              : "",
            call_penetration_count: callPenetration.length
              ? `="${callPenetration.length}"`
              : "",
            platform_user_id: c.platform_user_id
              ? `="${c.platform_user_id}"`
              : "",
            case_id: c.case_id ? `="${c.case_id}"` : "",
            dispo_date: c.dispo_date
              ? `="${formatDateTime(c.dispo_date)}"`
              : "",
            email1: c.email1 ?? "",
            email2: c.email2 ?? "",
            email3: c.email3 ?? "",
            emergencyContactName: c.emergencyContactName,
            emergencyContactMobile: c.emergencyContactMobile,
          };
        };

        const escapeCsvValue = (value) => {
          if (value === null || value === undefined) return "";
          const str = String(value);
          if (str === "") return "";
          if (/[",\r\n]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const writeLine = (stream, line) =>
          new Promise((resolve, reject) => {
            const handleError = (err) => {
              stream.removeListener("error", handleError);
              reject(err);
            };

            stream.once("error", handleError);

            if (stream.write(line)) {
              stream.removeListener("error", handleError);
              resolve();
              return;
            }

            stream.once("drain", () => {
              stream.removeListener("error", handleError);
              resolve();
            });
          });

        const timestamp = Date.now();
        const tmpDir = path.join(process.cwd(), "tmp");
        await fs.promises.mkdir(tmpDir, { recursive: true });

        const filePath = path.join(
          tmpDir,
          `${findCallfile.name}_${timestamp}.csv`
        );

        const writeStream = fs.createWriteStream(filePath, {
          encoding: "utf8",
        });

        await writeLine(writeStream, `${headers.join(",")}\n`);

        for await (const customer of cursor) {
          const formatted = formatCustomerRow(customer);
          const row = headers
            .map((key) => escapeCsvValue(formatted[key]))
            .join(",");
          await writeLine(writeStream, `${row}\n`);
        }

        await new Promise((resolve, reject) => {
          writeStream.end(resolve);
          writeStream.once("error", reject);
        });

        return `http://${process.env.MY_IP}:${process.env.PORT}/tmp/${findCallfile.name}_${timestamp}.csv`;
      } catch (error) {
        console.log(error);
        throw new CustomError(error.message, 500);
      }
    },
    monthlyDetails: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const findAomDept = await Department.find({ aom: user._id });
        const deptArray = findAomDept.map((e) => e.name);

        const findCallfile = await Callfile.aggregate([
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "callfileBucket",
            },
          },
          {
            $unwind: {
              path: "$callfileBucket",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "callfileBucket.dept": { $in: deptArray },
              active: { $eq: true },
            },
          },
        ]);

        const callfile = findCallfile.map(
          (e) => new mongoose.Types.ObjectId(e._id)
        );

        const positive = [
          "PTP",
          "FFUP",
          "UNEG",
          "RTP",
          "PAID",
          "DISP",
          "LM",
          "HUP",
          "ITP",
          "FV",
          "WN",
          "RPCCB",
        ];
        const success = [
          "ANSM",
          "UNK",
          "DEC",
          "BUSY",
          "NOA",
          "NIS",
          "OCA",
          "KOR",
        ];
        const connected = [success, positive].flat();

        const customerAccounts = await CustomerAccount.aggregate([
          {
            $match: {
              callfile: { $in: callfile },
            },
          },
          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "ca_bucket",
            },
          },
          {
            $unwind: { path: "$ca_bucket", preserveNullAndEmptyArrays: true },
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
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "ca_current_dispo",
            },
          },
          {
            $unwind: {
              path: "$ca_current_dispo",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "dispotypes",
              localField: "ca_current_dispo.disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          {
            $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true },
          },
          {
            $group: {
              _id: {
                callfile: "$callfile",
                department: "$ca_bucket.dept",
              },
              rpc: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$customer_info.isRPC", true],
                    },
                    1,
                    0,
                  ],
                },
              },
              success: {
                $sum: {
                  $cond: [
                    {
                      $in: ["$dispotype.code", success],
                    },
                    1,
                    0,
                  ],
                },
              },
              positive: {
                $sum: {
                  $cond: [
                    {
                      $in: ["$dispotype.code", positive],
                    },
                    1,
                    0,
                  ],
                },
              },
              unconnected: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        {
                          $not: [{ $in: ["$dispotype.code", connected] }],
                        },
                        {
                          $not: ["$current_disposition"],
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
              department: "$_id.department",
              rpc: 1,
              success: 1,
              positive: 1,
              unconnected: 1,
            },
          },
          {
            $sort: {
              department: 1,
            },
          },
        ]);

        return customerAccounts;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getToolsProduction: async (_, { bucket, interval }) => {
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
        let secondFilter = { "dispotype.code": { $in: ["PAID", "PTP"] } };

        if (interval === "daily") {
          (filter["callfile"] = { $in: callfile }),
            (filter["createdAt"] = { $gt: todayStart, $lte: todayEnd });
          (secondFilter["callfile"] = { $in: callfile }),
            (secondFilter["createdAt"] = { $gt: todayStart, $lte: todayEnd });
        } else if (interval === "weekly") {
          (filter["callfile"] = { $in: callfile }),
            (filter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek });
          (secondFilter["callfile"] = { $in: callfile }),
            (secondFilter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek });
        } else if (interval === "monthly") {
          (filter["callfile"] = { $in: callfile }),
            (filter["createdAt"] = { $gt: startOfMonth, $lte: endOfMonth });
          (secondFilter["callfile"] = { $in: callfile }),
            (secondFilter["createdAt"] = {
              $gt: startOfMonth,
              $lte: endOfMonth,
            });
        } else if (interval === "callfile") {
          filter["callfile"] = new mongoose.Types.ObjectId(
            existingCallfile?._id
          );
          secondFilter["callfile"] = new mongoose.Types.ObjectId(
            existingCallfile?._id
          );
        }

        const rpcCount = ["PTP", "PAID", "UNEG", "DISP", "RTP", "FFUP"];

        if (selectedBucket.principal) {
          if (!existingCallfile) return null;

          const TotalRPC = await Disposition.aggregate([
            {
              $match: {
                selectivesDispo: false,
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
                "dispotype.code": { $in: rpcCount },
                "customer.isRPC": { $eq: true },
              },
            },
            {
              $group: {
                _id: {
                  case_id: "$ca.case_id",
                },
                contact_method: { $first: "$contact_method" },
              },
            },
            {
              $group: {
                _id: "$contact_method",
                isRPC: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 1,
                isRPC: 1,
              },
            },
          ]);

          const findCustomersCallfile = await Disposition.aggregate([
            {
              $match: { callfile: existingCallfile?._id },
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
              $group: {
                _id: {
                  contact_method: "$contact_method",
                },
                ptp: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          {
                            $and: [
                              {
                                $eq: ["$dispotype.code", "PTP"],
                              },
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
                              {
                                $ne: [{ $ifNull: ["$paidDispo", null] }, null],
                              },
                              {
                                $expr: {
                                  $eq: ["$amount", "$ca.balance"],
                                },
                              },
                              { $eq: ["$dispotype.code", "PTP"] },
                              { $eq: ["$selectivesDispo", false] },
                            ],
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
                        $and: [
                          { $eq: ["$dispotype.code", "PAID"] },
                          { $eq: ["$ptp", true] },
                          { $eq: ["$selectivesDispo", true] },
                          { $ne: [{ $ifNull: ["$user", null] }, null] },
                          {
                            $eq: ["$ca.balance", 0],
                          },
                        ],
                      },
                      "$ca.out_standing_details.principal_os",
                      0,
                    ],
                  },
                },
                paid: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$dispotype.code", "PAID"] },
                          { $eq: ["$selectivesDispo", true] },
                          {
                            $eq: ["$ca.balance", 0],
                          },
                        ],
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
                contact_method: "$_id.contact_method",
                ptp: 1,
                kept: 1,
                paid: 1,
              },
            },
          ]);

          const newMap = findCustomersCallfile
            .filter((x) => x.contact_method !== null)
            .map((result) => {
              const checkTools = TotalRPC.find(
                (x) => x._id === result.contact_method
              );
              const isThier = checkTools ? checkTools : 0;

              return {
                ...result,
                contact_method: result.contact_method,
                rpc: isThier.isRPC,
              };
            });

          return newMap || null;
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
                "dispotype.code": { $in: rpcCount },
                "customer.isRPC": { $eq: true },
              },
            },
            {
              $group: {
                _id: {
                  case_id: "$ca.case_id",
                },
                contact_method: { $first: "$contact_method" },
              },
            },
            {
              $group: {
                _id: "$contact_method",
                isRPC: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 1,
                isRPC: 1,
              },
            },
          ]);

          const findCustomersCallfile = await Disposition.aggregate([
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
                from: "disposition",
                localField: "paidDispo",
                foreignField: "_id",
                as: "pd",
              },
            },
            {
              $unwind: { path: "$pd", preserveNullAndEmptyArrays: true },
            },
            {
              $match: secondFilter,
            },
            {
              $group: {
                _id: {
                  contact_method: "$contact_method",
                },
                ptp: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          {
                            $and: [
                              {
                                $eq: ["$dispotype.code", "PTP"],
                              },
                              { $eq: ["$existing", true] },
                            ],
                          },
                          {
                            $and: [
                              { $eq: ["$dispotype.code", "PAID"] },
                              { $eq: ["$ptp", true] },
                              { $eq: ["$selectivesDispo", false] },
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
                          { $ne: [{ $ifNull: ["$user", null] }, null] },
                        ],
                      },
                      "$amount",
                      0,
                    ],
                  },
                },
                paid: {
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
              },
            },
            {
              $project: {
                _id: 0,
                contact_method: "$_id.contact_method",
                ptp: 1,
                kept: 1,
                paid: 1,
              },
            },
          ]);

          const newMap = findCustomersCallfile
            .filter((x) => x.contact_method !== null)
            .map((result) => {
              const checkTools = TotalRPC.find(
                (x) => x._id === result.contact_method
              );
              const isThier = checkTools ? checkTools : 0;

              return {
                ...result,
                contact_method: result.contact_method,
                rpc: isThier.isRPC,
              };
            });

          return newMap || null;
        }
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getCollectionMonitoring: async (_, { bucket, interval }) => {
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

        const dispotypesFilter = await DispoType.findOne({
          code: { $eq: "PAID" },
        });

        let newDataCollected = {};

        let filter = {
          selectivesDispo: true,
          disposition: dispotypesFilter._id,
        };

        if (interval === "daily") {
          (filter["callfile"] = { $in: callfile }),
            (filter["createdAt"] = { $gt: todayStart, $lte: todayEnd });
          newDataCollected["target"] = Number(existingCallfile?.target) / 4 / 6;
        } else if (interval === "weekly") {
          (filter["callfile"] = { $in: callfile }),
            (filter["createdAt"] = { $gt: startOfWeek, $lte: endOfWeek });
          newDataCollected["target"] = Number(existingCallfile?.target) / 4;
        } else if (interval === "monthly") {
          (filter["callfile"] = { $in: callfile }),
            (filter["createdAt"] = { $gt: startOfMonth, $lte: endOfMonth });
          newDataCollected["target"] = Number(existingCallfile?.target);
        } else if (interval === "callfile") {
          filter["callfile"] = new mongoose.Types.ObjectId(
            existingCallfile._id
          );
          newDataCollected["target"] = Number(existingCallfile?.target);
        }

        const findCustomerCallfile = await Disposition.aggregate([
          {
            $match: filter,
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
        ]);

        newDataCollected["collected"] = findCustomerCallfile[0]?.collected || 0;

        return newDataCollected;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getCF: async (_, { bucket, limit, page }) => {
      try {
        const newpage = page > 0 ? page : 1;
        const skip = (newpage - 1) * limit;
        const callfile = await Callfile.aggregate([
          {
            $match: {
              bucket: new mongoose.Types.ObjectId(bucket),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "finished_by",
              foreignField: "_id",
              as: "finished_by",
            },
          },
          {
            $unwind: { path: "$finished_by", preserveNullAndEmptyArrays: true },
          },
          {
            $facet: {
              count: [
                {
                  $count: "total",
                },
              ],
              data: [
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
              ],
            },
          },
        ]);
        const data = callfile[0]?.data?.length > 0 ? callfile[0].data : [];
        const totals =
          callfile[0].count?.length > 0 ? callfile[0].count[0].total : 0;
        return {
          result: data,
          total: totals,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
  Result: {
    callfile: async (parent) => {
      try {
        return await Callfile.findById(parent.callfile).populate("finished_by");
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
  Mutation: {
    finishedCallfile: async (
      _,
      { callfile },
      { user, pubsub, PUBSUB_EVENTS }
    ) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const checkIfFinished = await Callfile.findById(callfile);
        if (checkIfFinished.endo)
          throw new CustomError("Already Finished", 400);
        const finishedCallfile = await Callfile.findByIdAndUpdate(
          callfile,
          {
            $set: {
              active: false,
              endo: new Date(),
              finished_by: user._id,
              autoDial: false,
            },
          },
          { new: true }
        );

        await CustomerAccount.updateMany(
          { callfile: new mongoose.Types.ObjectId(finishedCallfile._id) },
          {
            $unset: {
              assigned: "",
              assigned_date: "",
              assignedModel: "",
              on_hands: "",
            },
          }
        );

        if (!finishedCallfile) throw new CustomError("Callfile not found", 404);

        await pubsub.publish(PUBSUB_EVENTS.FINISHED_CALLFILE, {
          updateOnCallfiles: {
            bucket: finishedCallfile.bucket,
            message: PUBSUB_EVENTS.FINISHED_CALLFILE,
          },
        });

        return {
          success: true,
          message: "Callfile successfully finished",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    deleteCallfile: async (
      _,
      { callfile },
      { user, pubsub, PUBSUB_EVENTS }
    ) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const deleteCallfile = await Callfile.findByIdAndDelete(callfile);

        if (!deleteCallfile) throw CustomError("Callfile not found", 404);

        await pubsub.publish(PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE, {
          updateOnCallfiles: {
            bucket: deleteCallfile.bucket,
            message: PUBSUB_EVENTS.SOMETHING_NEW_ON_CALLFILE,
          },
        });

        return {
          success: true,
          message: "Callfile successfully deleted",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    setCallfileTarget: async (_, { callfile, target }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const setCallfile = await Callfile.findByIdAndUpdate(callfile, {
          $set: { target: target },
        });
        if (!setCallfile) throw new CustomError("Callfile not found", 404);

        return {
          message: "Successfully set callfile target",
          success: true,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    addSelective: async (
      _,
      { _id, selectiveName, selectives },
      { pubsub, PUBSUB_EVENTS, user }
    ) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const paidDispo = await DispoType.findOne({ code: "PAID" });
        const ptpDispo = await DispoType.findOne({ code: "PTP" });
        const callfile = await Callfile.findById(_id).populate("bucket");
        const newSelective = new Selective({
          name: selectiveName,
          callfile: callfile._id,
        });

        const bucket = callfile.bucket;

        const checkIfIsNaN = selectives
          .map((x) => isNaN(x.amount))
          .some((y) => y === true);

        if (checkIfIsNaN)
          throw new CustomError("Please check the amount of selective", 401);

        for (const i of selectives) {
          const res = await CustomerAccount.findOne({
            case_id: String(i.account_no),
            callfile: new mongoose.Types.ObjectId(callfile?._id),
          }).populate("current_disposition");

          if (!res) {
            continue;
          }

          if (res._id && res?.balance > 0) {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

            const cdCreatedAt =
              new Date(res?.current_disposition?.createdAt) <= threeDaysAgo;

            const data = {
              customer_account: res?._id,
              amount: i.amount,
              disposition: paidDispo?._id,
              selectivesDispo: true,
              selectiveFiles: newSelective?._id,
              callfile: callfile?._id,
              existing: true,
            };

            if (i.date && i.date !== "undefined") {
              data["payment_date"] = i.date;
            }

            if (
              res?.current_disposition &&
              !res?.current_disposition?.selectivesDispo &&
              res?.current_disposition?.disposition?.toString() ===
                paidDispo._id.toString()
            ) {
              data["user"] = res?.current_disposition?.user;
              data["createdAt"] = new Date(res?.current_disposition?.createdAt);
              data["contact_method"] = res?.current_disposition?.contact_method;
              data["ptp"] = res?.current_disposition?.ptp;
            }

            if (
              res?.current_disposition &&
              res?.current_disposition?.disposition?.toString() ===
                ptpDispo?._id?.toString() &&
              !res?.current_disposition?.selectivesDispo &&
              (!cdCreatedAt || bucket?.principal)
            ) {
              data["createdAt"] = new Date(res?.current_disposition?.createdAt);
              data["contact_method"] = res?.current_disposition?.contact_method;
              data["ptp"] = true;
              data["user"] = res?.current_disposition?.user;
            }

            if (res.balance === i.amount) {
              data["payment"] = "full";
            } else {
              data["payment"] = "partial";
            }

            const newDispo = new Disposition(data);

            if (res?.current_disposition) {
              const forUpdate = {
                existing: false,
              };

              if (
                (res?.current_disposition?.disposition === paidDispo?._id &&
                  !res?.current_disposition?.selectivesDispo) ||
                !cdCreatedAt
              ) {
                forUpdate["paidDispo"] = newDispo?._id;
              }

              await Disposition.findByIdAndUpdate(res?.current_disposition, {
                $set: forUpdate,
              });
            }

            await newDispo.save();
            await CustomerAccount.findByIdAndUpdate(res?._id, {
              $set: {
                current_disposition: newDispo?._id,
              },
              $inc: {
                balance:
                  res?.balance - Number(i.amount) < 0
                    ? -Number(res?.balance)
                    : -Number(i.amount),
                paid_amount: Number(i.amount),
              },
              $push: {
                history: newDispo,
              },
              $unset: {
                assigned: "",
                assigned_date: "",
                assignedModel: "",
              },
            });
          }
        }

        await newSelective.save();

        const users = (await User.find({ buckets: bucket?._id })).map((u) =>
          String(u._id)
        );

        await pubsub.publish(PUBSUB_EVENTS.DISPOSITION_UPDATE, {
          dispositionUpdated: {
            members: users,
            message: "NEW_DISPOSITION",
          },
        });

        return {
          success: true,
          message: "Successfully added selectives",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    
  },
};

export default callfileResolver;
