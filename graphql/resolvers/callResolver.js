import mongoose from "mongoose";
import CustomError from "../../middlewares/errors.js";
import {
  bargeUser,
  callViaVicidial,
  checkIfAgentIsInlineOnVici,
  checkIfAgentIsOnline,
  endAndDispo,
  getLoggedInUser,
  getRecordings,
  getUserInfo,
} from "../../middlewares/vicidial.js";
import Bucket from "../../models/bucket.js";
import Callfile from "../../models/callfile.js";
import CustomerAccount from "../../models/customerAccount.js";
import User from "../../models/user.js";
import DispoType from "../../models/dispoType.js";

const callResolver = {
  Query: {
    randomCustomer: async (_, { buckets, autoDial }) => {
      try {
        const userBuckets = (
          await Bucket.find({
            _id: { $in: buckets.map((x) => new mongoose.Types.ObjectId(x)) },
            canCall: true,
          })
        ).map((bucket) => bucket._id);

        const filter = {
          bucket: {
            $in: userBuckets.map((x) => new mongoose.Types.ObjectId(x)),
          },
          active: true,
        };
        const positiveDispotype = (
          await DispoType.find({ code: { $in: ["UNEG", "PAID"] } })
        ).map((dispotype) => dispotype._id);

        let secondFilter = null;

        if (autoDial) {
          filter["autoDial"] = true;
          secondFilter = [
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
          ];
        } else {
          secondFilter = [
            {
              "current_disposition.disposition": {
                $nin: positiveDispotype.map(
                  (x) => new mongoose.Types.ObjectId(x)
                ),
              },
            },
          ];
        }

        const findCallfile = (await Callfile.find(filter)).map((y) => y._id);

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

        const randomCustomer = await CustomerAccount.aggregate([
          {
            $match: {
              on_hands: false,
              callfile: {
                $in: findCallfile.map((x) => new mongoose.Types.ObjectId(x)),
              },
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
              $and: secondFilter,
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

        if (randomCustomer.length === 0) {
          return null;
        }

        return randomCustomer[0];
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    checkUserIsOnlineOnVici: async (_, { _id }) => {
      try {
        const findUser = await User.findById(_id).populate("buckets");
        if (!findUser) throw new CustomError("User not found", 401);

        if (findUser?.vici_id?.trim() === "")
          throw new CustomError("Please enter vicidial id", 401);

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
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },

    checkIfAgentIsInline: async (_, __, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const findUser = await User.findById(user._id).populate("buckets");

        if (findUser.vici_id.trim() === "")
          throw new CustomError("Please", 401);

        const bucket =
          findUser?.buckets?.length > 0
            ? new Array(...new Set(findUser?.buckets?.map((x) => x.viciIp)))
            : [];

        const chechIfisOnline = await Promise.all(
          bucket.map(async (x) => {
            const res = await checkIfAgentIsInlineOnVici(findUser?.vici_id, x);
            return res;
          })
        );

        return chechIfisOnline.find((x) => !x.includes("ERROR"));
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getUsersLogginOnVici: async (_, { bucket }) => {
      try {
        const selectedBucket = await Bucket.findById(bucket);
        if (!selectedBucket) throw new CustomError("Bucket not found", 401);

        if (!selectedBucket?.viciIp) return null;

        return await getLoggedInUser(selectedBucket.viciIp);
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
              on_hands: false,
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
      } catch (err) {
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
        const date = new Date();
        const year = date.getFullYear();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const newDate = `${year}${month.toString().padStart(2, "0")}${day
          .toString()
          .padStart(2, "0")}`;

        const findUser = await User.findById(user_id).populate("buckets");
        if (!findUser) throw new CustomError("User not found", 401);

        if (findUser?.vici_id.trim() === "")
          throw new CustomError(
            "Please Contact Admin to add Vici dial ID",
            401
          );

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

        const res = await getRecordings(
          bucket[chechIfisOnline.indexOf(true)],
          findUser?.vici_id
        );

        const userInfoRes = await getUserInfo(
          bucket[chechIfisOnline.indexOf(true)],
          findUser?.vici_id
        );

        const campaign_ID = userInfoRes.split("session_id")[1].split(",")[3];

        const secondSplitRes = res.split(" ");
        const forDuration = res.split("|");

        const duration = forDuration[forDuration.length - 2];

        const time = secondSplitRes[secondSplitRes.length - 1]
          .split("|")[0]
          .replace(/:/g, "");

        return `${campaign_ID}_${newDate}-${time}_${findUser?.vici_id}_${mobile}-all.mp3_${duration}`;
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

        const userViciIp = await getUserInfo(bucket[chechIfisOnline.indexOf(true)],findUser.vici_id);
        
        console.log(userViciIp)


        const res = await bargeUser(
          bucket[chechIfisOnline.indexOf(true)],
          session_id,
          tlUser.vici_id
        );

        return res;
      } catch (error) {
        throw new CustomError(error, 500);
      }
    },
  },
};

export default callResolver;
