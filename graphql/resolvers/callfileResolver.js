import mongoose from "mongoose";
import { DateTime } from "../../middlewares/dateTime.js";
import CustomError from "../../middlewares/errors.js";
import Callfile from "../../models/callfile.js";
import CustomerAccount from "../../models/customerAccount.js";
import { json2csv } from "json-2-csv";
import Department from "../../models/department.js";
import DispoType from "../../models/dispoType.js";
import Bucket from "../../models/bucket.js";
import Disposition from "../../models/disposition.js";
import Selective from "../../models/selective.js";
import User from "../../models/user.js";

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
                                $eq: ["$$history.disposition", paidDispo._id],
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
                          input: "$customerInfo.emails",
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
                          input: "$customerInfo.contact_no",
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

    downloadCallfiles: async (_, { callfile }) => {
      try {
        const findCallfile = await Callfile.findById(callfile).lean();

        if (!findCallfile) return null;

        const customers = await CustomerAccount.aggregate([
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
            $addFields: {
              contact1: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.contact_no" }, 1] },
                  then: { $arrayElemAt: ["$customer_info.contact_no", 0] },
                  else: "",
                },
              },
              contact2: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.contact_no" }, 2] },
                  then: { $arrayElemAt: ["$customer_info.contact_no", 1] },
                  else: "",
                },
              },
              contact3: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.contact_no" }, 3] },
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
                  if: { $gte: [{ $size: "$customer_info.emails" }, 1] },
                  then: { $arrayElemAt: ["$customer_info.emails", 0] },
                  else: "",
                },
              },
              email2: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.emails" }, 2] },
                  then: { $arrayElemAt: ["$customer_info.emails", 1] },
                  else: "",
                },
              },
              email3: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.emails" }, 3] },
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
                  if: { $gte: [{ $size: "$customer_info.addresses" }, 1] },
                  then: { $arrayElemAt: ["$customer_info.addresses", 0] },
                  else: "",
                },
              },
              address2: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.addresses" }, 2] },
                  then: { $arrayElemAt: ["$customer_info.addresses", 1] },
                  else: "",
                },
              },
              address3: {
                $cond: {
                  if: { $gte: [{ $size: "$customer_info.addresses" }, 3] },
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
                    input: "$customer_info.contact_no",
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
                                $ifNull: ["$emergency_contact.mobile", ""],
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
                    input: "$customer_info.emails",
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
              new_tad_with_sf: "$out_standing_details.new_tad_with_sf",
              new_pay_off: "$out_standing_details.new_pay_off",
              service_fee: "$out_standing_details.service_fee",
              dialer: "$currentDispo.dialer",
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
            },
          },
        ]);

        const csv = json2csv(customers, {
          keys: [
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
            "endorsement_date",
            "contactable",
            "dialer",
            "partial_payment_w_service_fee",
            "new_tad_with_sf",
            "new_pay_off",
            "service_fee",
            "year",
            "brand",
            "model",
            "last_payment_amount",
            "last_payment_date",
          ],
          emptyFieldValue: "",
        });

        return csv;
      } catch (error) {
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
        const callfile = (
          await Callfile.find({ bucket: selectedBucket._id }).lean()
        ).map((cf) => new mongoose.Types.ObjectId(cf._id));
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
        if (interval === "daily") {
          selectedInterval["$gt"] = todayStart;
          selectedInterval["$lte"] = todayEnd;
        } else if (interval === "weekly") {
          selectedInterval["$gt"] = startOfWeek;
          selectedInterval["$lte"] = endOfWeek;
        } else if (interval === "monthly") {
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
            $match: {
              createdAt: selectedInterval,
              callfile: { $in: callfile },
              "dispotype.code": { $in: ["PAID", "PTP"] },
            },
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

        const newMap = findCustomersCallfile.map((result) => {
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
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getCollectionMonitoring: async (_, { bucket, interval }) => {
      try {
        const selectedBucket = await Bucket.findById(bucket).lean();

        const callfile = (
          await Callfile.find({ bucket: selectedBucket._id })
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
        const existingFile = await Callfile.findOne({
          bucket: selectedBucket._id,
          active: { $eq: true },
        });

        let selectedInterval = {};
        let newDataCollected = {};

        if (interval === "daily") {
          selectedInterval["$gt"] = todayStart;
          selectedInterval["$lte"] = todayEnd;
          newDataCollected["target"] = Number(existingFile.target) / 4 / 6;
        } else if (interval === "weekly") {
          selectedInterval["$gt"] = startOfWeek;
          selectedInterval["$lte"] = endOfWeek;
          newDataCollected["target"] = Number(existingFile.target) / 4;
        } else if (interval === "monthly") {
          selectedInterval["$gt"] = startOfMonth;
          selectedInterval["$lte"] = endOfMonth;
          newDataCollected["target"] = Number(existingFile.target);
        }

        const dispotypesFilter = await DispoType.findOne({
          code: { $eq: "PAID" },
        });

        const findCustomerCallfile = await Disposition.aggregate([
          {
            $match: {
              createdAt: selectedInterval,
              callfile: { $in: callfile },
              disposition: dispotypesFilter._id,
              selectivesDispo: true,
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
            $unset: { assigned: "", assigned_date: "", assignedModel: "" },
            $set: { on_hands: false },
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

        const callfile = await Callfile.findById(_id);
        const newSelective = await Selective.create({
          name: selectiveName,
          callfile: callfile._id,
        });

        for (const i of selectives) {
          const res = await CustomerAccount.findOne({
            case_id: { $eq: String(i.account_no) },
            callfile: { $eq: new mongoose.Types.ObjectId(callfile._id) },
          }).populate("current_disposition");

          if (!res) {
            continue;
          }

          if (res && res.balance > 0) {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

            const cdCreatedAt =
              new Date(res?.current_disposition?.createdAt) <= threeDaysAgo;

            const data = {
              customer_account: res._id,
              amount: i.amount,
              disposition: paidDispo._id,
              selectivesDispo: true,
              selectiveFiles: newSelective._id,
              callfile: callfile,
              existing: true,
              contact_method: res?.current_disposition?.contact_method,
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
              data["ptp"] = res?.current_disposition?.ptp;
            }

            if (
              res?.current_disposition &&
              res?.current_disposition?.disposition?.toString() ===
                ptpDispo?._id?.toString() &&
              !res?.current_disposition?.selectivesDispo
            ) {
              data["createdAt"] = new Date(res?.current_disposition?.createdAt);
              data["ptp"] = true;
              if (!cdCreatedAt) {
                data["user"] = res?.current_disposition?.user;
              }
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
                  res?.balance - Number(i.amount) < 0 ? 0 : -Number(i.amount),
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

        const users = (await User.find({ buckets: callfile.bucket })).map((u) =>
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
