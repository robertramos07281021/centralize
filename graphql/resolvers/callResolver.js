import mongoose from "mongoose";
import CustomError from "../../middlewares/errors.js";
import {
  bargeUser,
  callViaVicidial,
  checkIfAgentIsInlineOnVici,
  checkIfAgentIsOnline,
  checkingLiveCall,
  endAndDispo,
  getCallInfo,
  getLoggedInUser,
  getRecordings,
  getUserInfo,
} from "../../middlewares/vicidial.js";
import Bucket from "../../models/bucket.js";
import Callfile from "../../models/callfile.js";
import CustomerAccount from "../../models/customerAccount.js";
import User from "../../models/user.js";
import DispoType from "../../models/dispoType.js";
import Disposition from "../../models/disposition.js";

const callResolver = {
  Query: {
    // randomCustomer: async (_, { buckets, autoDial }) => {
    //   try {
    //     const userBuckets = (
    //       await Bucket.find({
    //         _id: { $in: buckets.map((x) => new mongoose.Types.ObjectId(x)) },
    //         canCall: true,
    //       })
    //     ).map((bucket) => bucket._id);

    //     const filter = {
    //       bucket: {
    //         $in: userBuckets.map((x) => new mongoose.Types.ObjectId(x)),
    //       },
    //       active: true,
    //     };
    //     const positiveDispotype = (
    //       await DispoType.find({ code: { $in: ["UNEG", "PAID"] } })
    //     ).map((dispotype) => dispotype._id);

    //     let secondFilter = null;

    //     if (autoDial) {
    //       filter["autoDial"] = true;
    //       secondFilter = [
    //         {
    //           "current_disposition.disposition": {
    //             $nin: positiveDispotype.map(
    //               (x) => new mongoose.Types.ObjectId(x)
    //             ),
    //           },
    //         },
    //         {
    //           $expr: {
    //             $ne: ["$features.called", "$ac.roundCount"],
    //           },
    //         },
    //       ];
    //     } else {
    //       secondFilter = [
    //         {
    //           "current_disposition.disposition": {
    //             $nin: positiveDispotype.map(
    //               (x) => new mongoose.Types.ObjectId(x)
    //             ),
    //           },
    //         },
    //       ];
    //     }

    //     const findCallfile = (await Callfile.find(filter)).map((y) => y._id);

    //     const startOfTheDay = new Date();
    //     startOfTheDay.setHours(0, 0, 0, 0);
    //     const endOfTheDay = new Date();
    //     endOfTheDay.setHours(23, 59, 59, 999);
    //     const success = [
    //       "PTP",
    //       "UNEG",
    //       "FFUP",
    //       "KOR",
    //       "NOA",
    //       "FV",
    //       "HUP",
    //       "LM",
    //       "ANSM",
    //       "DEC",
    //       "RTP",
    //       "ITP",
    //       "PAID",
    //     ];

    //     const randomCustomer = await CustomerAccount.aggregate([
    //       {
    //         $match: {
    //           on_hands: false,
    //           callfile: {
    //             $in: findCallfile.map((x) => new mongoose.Types.ObjectId(x)),
    //           },
    //           $or: [
    //             { assigned: { $eq: null } },
    //             { assigned: { $exists: false } },
    //           ],
    //         },
    //       },
    //       {
    //         $lookup: {
    //           from: "customers",
    //           localField: "customer",
    //           foreignField: "_id",
    //           as: "customer_info",
    //         },
    //       },
    //       {
    //         $unwind: {
    //           path: "$customer_info",
    //           preserveNullAndEmptyArrays: true,
    //         },
    //       },
    //       {
    //         $match: {
    //           $expr: { $gt: [{ $size: "$customer_info.contact_no" }, 0] },
    //         },
    //       },
    //       {
    //         $lookup: {
    //           from: "dispotypes",
    //           localField: "disposition",
    //           foreignField: "_id",
    //           as: "dispotype",
    //         },
    //       },
    //       {
    //         $unwind: {
    //           path: "$dispotype",
    //           preserveNullAndEmptyArrays: true,
    //         },
    //       },
    //       {
    //         $lookup: {
    //           from: "buckets",
    //           localField: "bucket",
    //           foreignField: "_id",
    //           as: "account_bucket",
    //         },
    //       },
    //       {
    //         $unwind: {
    //           path: "$account_bucket",
    //           preserveNullAndEmptyArrays: true,
    //         },
    //       },
    //       {
    //         $lookup: {
    //           from: "dispositions",
    //           localField: "current_disposition",
    //           foreignField: "_id",
    //           as: "current_disposition",
    //         },
    //       },
    //       {
    //         $unwind: {
    //           path: "$current_disposition",
    //           preserveNullAndEmptyArrays: true,
    //         },
    //       },
    //       {
    //         $lookup: {
    //           from: "callfiles",
    //           localField: "callfile",
    //           foreignField: "_id",
    //           pipeline: [
    //             { $match: filter },
    //           ],
    //           as: "ac",
    //         },
    //       },
    //       {
    //         $unwind: {
    //           path: "$ac",
    //           preserveNullAndEmptyArrays: true,
    //         },
    //       },
    //       {
    //         $match: {
    //           $and: secondFilter,
    //         },
    //       },

    //       {
    //         $lookup: {
    //           from: "dispositions",
    //           localField: "history",
    //           foreignField: "_id",
    //           as: "dispo_history",
    //         },
    //       },
    //       {
    //         $addFields: {
    //           isRPCToday: {
    //             $cond: {
    //               if: {
    //                 $and: [
    //                   { $in: ["$dispotype.code", success] },
    //                   { $gte: ["$createdAt", startOfTheDay] },
    //                   { $lte: ["$createdAt", endOfTheDay] },
    //                 ],
    //               },
    //               then: true,
    //               else: false,
    //             },
    //           },
    //         },
    //       },
    //       { $sample: { size: 1 } },
    //     ]);

    //     if (randomCustomer.length === 0) {
    //       return null;
    //     }
    //     console.log(randomCustomer[0]);

    //     return randomCustomer[0];
    //   } catch (error) {
    //     throw new CustomError(error.message, 500);
    //   }
    // },
    randomCustomer: async (_, { buckets, autoDial }) => {
      try {
        const userBucketIds = buckets.map(
          (id) => new mongoose.Types.ObjectId(id)
        );

        const bucketDocs = await Bucket.find({
          _id: { $in: userBucketIds },
          canCall: true,
        }).select("_id");

        const callfiles = await Callfile.find({
          bucket: { $in: bucketDocs.map((x) => x._id) },
          active: true,
        }).select("_id autoDial roundCount");

        const allowedBuckets = bucketDocs.map((b) => b._id);

        const positiveDispotype = await DispoType.find({
          code: { $in: ["UNEG", "PAID", "LM", "UNK", "FFUP", "DISP"] },
        }).select("_id");

        const positiveIds = positiveDispotype.map((x) => x._id);

        // Prepare callfile filter
        let callfileFilter = callfiles.map((x) => x._id);
        if (autoDial) {
          const callfileAuto = callfiles.filter((x) => x.autoDial === true);
          callfileFilter = callfileAuto.map((x) => x._id);
        }

        const pipeline = [
          // --- Early filter ---
          {
            $match: {
              $or: [{ on_hands: null }, { on_hands: { $exists: false } }],
              bucket: { $in: allowedBuckets },
              $or: [{ assigned: null }, { assigned: { $exists: false } }],
              callfile: { $in: callfileFilter },
            },
          },

          // --- Lookup callfile to get roundCount if autoDial ---
          {
            $lookup: {
              from: "callfiles",
              localField: "callfile",
              foreignField: "_id",
              as: "ac",
              pipeline: [
                { $project: { roundCount: 1, autoDial: 1, active: 1 } },
              ],
            },
          },
          { $unwind: "$ac" },

          // --- Filter based on dispositions and call status ---
          {
            $match: {
              "current_disposition.disposition": { $nin: positiveIds },
              ...(autoDial
                ? { $expr: { $lt: ["$features.called", "$ac.roundCount"] } }
                : {
                    $expr: {
                      $or: [
                        { $eq: ["$features.alreadyCalled", false] },
                        {
                          $not: { $ifNull: ["$features.alreadyCalled", false] },
                        },
                      ],
                    },
                  }),
            },
          },

          // --- Lookup customer info ---
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer_info",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    contact_no: 1,
                    dob: 1,
                    gender: 1,
                    emails: 1,
                    addresses: 1,
                    isRPC: 1,
                  },
                },
              ],
            },
          },
          { $unwind: "$customer_info" },

          // --- Keep only docs with at least one valid contact number ---
          {
            $match: {
              $expr: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ["$customer_info.contact_no", []] },
                        as: "num",
                        cond: { $ne: ["$$num", ""] },
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },

          // --- Pick 1 random customer ---
          { $sample: { size: 1 } },

          // --- Lookup other related data ---
          {
            $lookup: {
              from: "dispotypes",
              localField: "disposition",
              foreignField: "_id",
              as: "dispotype",
            },
          },
          { $unwind: { path: "$dispotype", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "buckets",
              localField: "bucket",
              foreignField: "_id",
              as: "account_bucket",
            },
          },
          { $unwind: "$account_bucket" },

          {
            $lookup: {
              from: "dispositions",
              localField: "current_disposition",
              foreignField: "_id",
              as: "current_disposition",
            },
          },
          {
            $unwind: {
              path: "$current_disposition",
              preserveNullAndEmptyArrays: true,
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
        ];

        const res = await CustomerAccount.aggregate(pipeline);
        return res[0] || null;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    checkUserIsOnlineOnVici: async (_, { _id }, { user }) => {
      try {
        if (!user) return null;

        const findUser = await User.findById(_id).populate("buckets");
        if (!findUser) throw new CustomError("User not found", 401);

        if (findUser?.vici_id?.trim() === "") {
          return null;
        }

        const newBucketMap = findUser?.buckets.map((y) => y.canCall);

        if (newBucketMap.includes(true)) {
          const bucket =
            findUser?.buckets?.length > 0
              ? new Array(...new Set(findUser?.buckets?.map((x) => x.viciIp)))
              : [];

          const chechIfisOnline = await Promise.all(
            bucket.map(async (x) => {
              const res = await checkIfAgentIsOnline(findUser?.vici_id, x);
              return res;
            })
          );
          return chechIfisOnline.includes(true);
        } else {
          return false;
        }
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    checkIfAgentIsInline: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const findUser = await User.findById(user._id)
          .populate("buckets", "viciIp viciIp_auto")
          .lean();

        const viciId = findUser?.vici_id || "";

        if (viciId.trim() === "") return "NO_VICI_ID";

        const bucket =
          findUser?.buckets?.length > 0
            ? new Array(
                ...new Set(
                  findUser?.buckets?.map((x) => {
                    return {
                      viciIp: x.viciIp,
                      viciIp_auto: x.viciIp_auto,
                    };
                  })
                )
              )
            : [];

        const chechIfisOnline = await Promise.all(
          bucket.map(async (x) => {
            const data = [];
            const res = await checkIfAgentIsInlineOnVici(
              findUser?.vici_id,
              x.viciIp
            );

            data.push(`${res.trim("\n") + "|" + x.viciIp}`.toString());

            if (x.viciIp_auto) {
              const resAuto = await checkIfAgentIsInlineOnVici(
                findUser?.vici_id,
                x.viciIp_auto
              );
              data.push(
                `${resAuto.trim("\n") + "|" + x.viciIp_auto}`.toString()
              );
            }
            return data.toString();
          })
        );

        return chechIfisOnline.toString();
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getUsersLogginOnVici: async (_, { bucket }) => {
      try {
        if (!bucket) return null;
        const selectedBucket = await Bucket.findById(bucket);
        if (!selectedBucket) throw new CustomError("Bucket not found", 401);

        if (!selectedBucket?.viciIp) return null;

        return await getLoggedInUser(selectedBucket?.viciIp);
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    isAutoDial: async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      try {
        const userCallfiles = await Callfile.find({
          bucket: {
            $in: user.buckets.map(
              (bucket) => new mongoose.Types.ObjectId(bucket)
            ),
          },
          active: true,
        });
        const callfilesBoolean = userCallfiles.map((ucf) => ucf.autoDial);
        return callfilesBoolean.includes(true);
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    checkIfCallfileAutoIsDone: async (_, { callfile }) => {
      try {
        if (!callfile) return null;

        const positiveDispotype = (
          await DispoType.find({ code: { $in: ["UNEG", "PAID"] } })
        ).map((dispotype) => dispotype._id);

        const findCallfile = await Callfile.findById(callfile);

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

        const findRandomCustomer = await CustomerAccount.aggregate([
          {
            $match: {
              on_hands: null,
              callfile: findCallfile._id,
              $or: [
                { assigned: { $eq: null } },
                { assigned: { $exists: false } },
              ],
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
            $match: {
              $expr: { $gt: [{ $size: "$customer_info.contact_no" }, 0] },
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
              as: "current_disposition",
            },
          },
          {
            $unwind: {
              path: "$current_disposition",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "callfiles",
              localField: "callfile",
              foreignField: "_id",
              as: "ac",
            },
          },
          {
            $unwind: {
              path: "$ac",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: "$current_disposition",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $and: [
                {
                  "current_disposition.disposition": {
                    $nin: positiveDispotype.map(
                      (x) => new mongoose.Types.ObjectId(x)
                    ),
                  },
                },
                {
                  $expr: {
                    $ne: ["$features.called", "$ac.roundCount"],
                  },
                },
              ],
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
          {
            $addFields: {
              isRPCToday: {
                $cond: {
                  if: {
                    $and: [
                      { $in: ["$dispotype.code", success] },
                      { $gte: ["$createdAt", startOfTheDay] },
                      { $lte: ["$createdAt", endOfTheDay] },
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          { $sample: { size: 1 } },
        ]);

        return findRandomCustomer.length === 0;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getBargingStatus: async (_, { vici_id }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const res = await getUserInfo(vici_id, user.vici_id);

        return res;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },

  Mutation: {
    makeCall: async (_, { phoneNumber }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        if (!phoneNumber) return null;
        const findUser = await User.findById(user._id).populate("buckets");
        const bucket =
          findUser?.buckets?.length > 0
            ? new Array(...new Set(findUser?.buckets?.map((x) => x.viciIp)))
            : [];

        const chechIfisOnline = await Promise.all(
          bucket.map(async (x) => {
            const res = await checkIfAgentIsOnline(findUser?.vici_id, x);
            return res;
          })
        );

        const res = await callViaVicidial(
          findUser.vici_id,
          phoneNumber,
          bucket[chechIfisOnline.indexOf(true)]
        );
        return `Call initiated successfully: ${JSON.stringify(res)}`;
      } catch (error) {
        throw new CustomError(err.message, 500);
      }
    },
    setCallfileToAutoDial: async (
      _,
      { callfileId, roundCount, finished },
      { pubsub, PUBSUB_EVENTS }
    ) => {
      try {
        const findCallfile = await Callfile.findById(callfileId);
        if (!findCallfile) throw new CustomError("Callfile not found", 401);

        findCallfile.autoDial = !findCallfile.autoDial;

        findCallfile.roundCount = roundCount;

        await findCallfile.save();

        if (!finished) {
          await CustomerAccount.updateMany(
            {
              callfile: findCallfile._id,
            },
            {
              $set: {
                "features.called": 0,
              },
            }
          );
        }

        await pubsub.publish(PUBSUB_EVENTS.NEW_UPDATE_CALLFILE, {
          updateOnCallfiles: {
            bucket: findCallfile?.bucket,
            message: PUBSUB_EVENTS.NEW_UPDATE_CALLFILE,
          },
        });

        return {
          success: true,
          message: "Callfile successfully updated",
        };
      } catch (error) {
        throw new CustomError(error, 500);
      }
    },
    endAndDispoCall: async (_, __, { user }) => {
      try {
        const findUser = await User.findById(user._id).populate("buckets");

        if (!findUser) return null;

        const bucket =
          findUser?.buckets?.length > 0
            ? new Array(...new Set(findUser?.buckets?.map((x) => x.viciIp)))
            : [];

        const chechIfisOnline = await Promise.all(
          bucket.map(async (x) => {
            const res = await checkIfAgentIsOnline(findUser?.vici_id, x);
            return res;
          })
        );

        await endAndDispo(user.vici_id, bucket[chechIfisOnline.indexOf(true)]);

        return {
          success: true,
          message: "Successfully end call",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getCallRecording: async (_, { user_id, mobile }) => {
      try {
        if (!Boolean(mobile)) return null;

        const date = new Date();
        const year = date.getFullYear();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const newDate = `${year}${month.toString().padStart(2, "0")}${day
          .toString()
          .padStart(2, "0")}`;

        const findUser = await User.findById(user_id).populate(
          "buckets",
          "viciIp viciIp_auto"
        );
        if (!findUser) throw new CustomError("User not found", 401);

        const viciId = findUser?.vici_id || "";

        if (viciId.trim() === "")
          throw new CustomError(
            "Please Contact Admin to add Vici dial ID",
            401
          );

        const splitMobile = mobile?.split("|");

        const res = await getRecordings(splitMobile[1], viciId, null);

        if (!res || res.include("ERROR")) return null;

        const userInfoRes = await getUserInfo(splitMobile[1], viciId);
        const campaign_ID = userInfoRes.split("computer_ip")[1]?.split(",")[3];

        const secondSplitRes = res?.split(" ") || [];
        const forDuration = res?.split("|") || [];

        const duration = forDuration[forDuration.length - 2];

        const time = secondSplitRes[secondSplitRes.length - 1]
          .split("|")[0]
          .replace(/:/g, "");

        return `${campaign_ID}_${newDate}-${time}_${viciId}_${splitMobile[0]}-all.mp3_${duration}`;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    bargeCall: async (_, { session_id, viciUser_id }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const tlUser = await User.findById(user._id);

        const findUser = await User.findOne({
          vici_id: { $eq: viciUser_id },
          type: "AGENT",
        }).populate("buckets");
        if (!findUser) throw new CustomError("User not found", 401);

        const bucket =
          findUser?.buckets?.length > 0
            ? new Array(...new Set(findUser?.buckets?.map((x) => x.viciIp)))
            : [];

        const chechIfisOnline = await Promise.all(
          bucket.map(async (x) => {
            const res = await checkIfAgentIsOnline(findUser?.vici_id, x);
            return res;
          })
        );

        const res = await bargeUser(
          bucket[chechIfisOnline.indexOf(true)],
          session_id,
          tlUser.softphone
        );

        return res;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    updateDialNext: async (_, { callfile }) => {
      try {
        await CustomerAccount.updateMany(
          {
            callfile: new mongoose.Types.ObjectId(callfile),
          },
          {
            $set: {
              "features.alreadyCalled": false,
            },
          }
        );

        return {
          success: true,
          message: "Callfile successfully reset dial next call",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    lateCallRecording: async (_, { id }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const dispo = await Disposition.aggregate([
          {
            $match: {
              _id: new mongoose.Types.ObjectId(id),
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
            $unwind: {
              path: "$ca",
              preserveNullAndEmptyArrays: true,
            },
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
            $unwind: {
              path: "$bucket",
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
            $unwind: {
              path: "$customer",
              preserveNullAndEmptyArrays: true,
            },
          },
        ]);

        const dispoDate = dispo[0].createdAt;

        const d = new Date(dispoDate);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");

        const formattedDate = `${year}-${month}-${day}`;

        const getRecordingManual = await getRecordings(
          dispo[0].bucket.viciIp,
          user.vici_id,
          formattedDate
        );

        const records = [];

        if (!getRecordingManual.includes("ERROR")) {
          const splitManualRecordings = getRecordingManual.split("-all.").map(x=> `${dispo[0].bucket.viciIp}_${x}`);
          records.push(...splitManualRecordings.flat());
        }

        if (dispo[0].bucket.viciIp_auto) {
          const getRecordingAuto = await getRecordings(
            dispo[0].bucket.viciIp_auto,
            user.vici_id,
            formattedDate
          );

          if (!getRecordingAuto.includes("ERROR")) {
            const splitAutoRecordings = getRecordingAuto.split("-all.").map(x=> `${dispo[0].bucket.viciIp_auto}_${x}`);
            records.push(...splitAutoRecordings.flat());
          }
        }

        const contact = [...new Set(dispo[0].customer.contact_no)];

        if (dispo[0]?.customer?.emergency?.mobile) {
          contact.push(dispo[0].customer?.emergency?.mobile);
        }
   
        const recordings = [];
        for (const record of records) {
       
          if (contact.some((x) => record.includes(x))) {
            const splitRecord = record.split("/");
            const ip = record.split('_')[0]

            const duration = record.split("|")[4];
            recordings.push(
              `${splitRecord[splitRecord.length - 1]}-all.mp3_${duration}_${
                ip
              }`
            );
          }
        }
 
        const trueRecordings = [];

        for (const recording of recordings) {
          const spliting = recording.split(".mp3");
          
          const findRecording = await Disposition.aggregate([
            {
              $match: {
                $text: { $search: `"${spliting[0]}"` },
              },
            },
          ]);
          if (findRecording.length <= 0) {
            trueRecordings.push(recording);
          }
        }
        
        return trueRecordings;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getLastCall: async (_,{phone,vici_id}) => {

    }
  },
};

export default callResolver;
