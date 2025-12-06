import "dotenv/config.js";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import cors from "cors";
import { expressMiddleware } from "@apollo/server/express4";
import connectDB from "./dbConnection/_db.js";
import User from "./models/user.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { useServer } from "graphql-ws/use/ws";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import userResolvers from "./graphql/resolvers/userResolvers.js";
import userTypeDefs from "./graphql/schemas/userSchema.js";
import deptResolver from "./graphql/resolvers/departmentResolver.js";
import deptTypeDefs from "./graphql/schemas/departmentSchema.js";
import branchTypeDefs from "./graphql/schemas/branchSchema.js";
import branchResolver from "./graphql/resolvers/branchResolver.js";
import bucketTypeDefs from "./graphql/schemas/bucketSchema.js";
import bucketResolver from "./graphql/resolvers/bucketResolver.js";
import modifyReportResolver from "./graphql/resolvers/modifyReportResolver.js";
import modifyReportTypeDefs from "./graphql/schemas/modifyReportSchema.js";
import customerResolver from "./graphql/resolvers/customerResolver.js";
import customerTypeDefs from "./graphql/schemas/customerSchema.js";
import dispositionTypeDefs from "./graphql/schemas/dispositionSchema.js";
import dispositionResolver from "./graphql/resolvers/dispositionResolver.js";
import dispositionTypeResolver from "./graphql/resolvers/dispositionTypesResolver.js";
import dispositionTypeTypeDefs from "./graphql/schemas/dispositionTypeSchema.js";
import groupResolver from "./graphql/resolvers/groupResolver.js";
import groupTypeDefs from "./graphql/schemas/groupSchema.js";
import taskResolver from "./graphql/resolvers/taskResolver.js";
import taskTypeDefs from "./graphql/schemas/taskSchema.js";
import productionResolver from "./graphql/resolvers/productionResolver.js";
import productionTypeDefs from "./graphql/schemas/productionSchema.js";
import session from "express-session";
import callfileResolver from "./graphql/resolvers/callfileResolver.js";
import callfileTypeDefs from "./graphql/schemas/callfileSchema.js";
import compression from "compression";
import recordingsResolver from "./graphql/resolvers/recordingsResolver.js";
import recordingTypeDefs from "./graphql/schemas/recordingsSchema.js";
import { PUBSUB_EVENTS } from "./middlewares/pubsubEvents.js";
import pubsub from "./middlewares/pubsub.js";
import subscriptionResolvers from "./graphql/resolvers/subscriptionResolvers.js";
import subscriptionTypeDefs from "./graphql/schemas/subcriptionSchema.js";
import MongoStore from "connect-mongo";
import CustomError from "./middlewares/errors.js";
import path from "path";
import CustomerExtnResolver from "./graphql/resolvers/customerExtnResolver.js";
import CustomerExtnTypeDefs from "./graphql/schemas/customerExtnSchema.js";
import cron from "node-cron";
import CustomerAccount from "./models/customerAccount.js";
import callResolver from "./graphql/resolvers/callResolver.js";
import callTypeDefs from "./graphql/schemas/callSchema.js";
import { checkIfAgentIsOnline, logoutVici } from "./middlewares/vicidial.js";
import selectivesResolver from "./graphql/resolvers/selectivesResolver.js";
import selectivesTypeDefs from "./graphql/schemas/selectivesSchema.js";
import DispoType from "./models/dispoType.js";
import Production from "./models/production.js";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import scoreCardResolver from "./graphql/resolvers/scoreCardResolver.js";
import scoreCardTypeDefs from "./graphql/schemas/scoreCardSchema.js";

const __filename = fileURLToPath(import.meta.url);

// Equivalent of __dirname
const __dirname = path.dirname(__filename);

const connectedUsers = new Map();

function getMillisecondsUntilEndOfDay() {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime() - now.getTime();
}

const app = express();
connectDB();
const allowedOrigins = [
  process.env.MY_FRONTEND,
  "http://localhost:4000",
  "http://localhost:3000",
  `http://${process.env.MY_IP}:4000`,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(compression());

app.use("/recordings", express.static(path.join(process.cwd(), "recordings")));
app.use("/tmp", express.static(path.join(__dirname, "tmp")));

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setHours(24, 0, 0, 0);
const secondsUntilMidnight = Math.floor((tomorrow - now) / 1000);

const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URL,
  collectionName: "sessions",
  ttl: secondsUntilMidnight,
});

const sessionMiddleware = session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  },
});

app.use(sessionMiddleware);

app.use((req, res, next) => {
  if (req.session && !req.session.cookie.maxAge) {
    req.session.cookie.maxAge = getMillisecondsUntilEndOfDay();
  }
  next();
});

cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const dispotype = await DispoType.findOne({ code: "PTP" });

      if (!dispotype) throw new Error("DispoType PTP not found");

      const cursor = await CustomerAccount.aggregate([
        {
          $match: {
            assigned: { $ne: null },
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
        { $unwind: { path: "$cd", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            "cd.createdAt": { $lte: cutoff },
            "cd.disposition": dispotype._id,
          },
        },
        { $project: { _id: 1, user: "$cd.user" } },
      ])
        .allowDiskUse(true)
        .cursor({ BATCH_SIZE: 500 })
        .exec();

      const BATCH_SIZE = 500;
      let batchIds = [];
      let batchUsers = new Set();

      for await (const doc of cursor) {
        batchIds.push(doc._id);
        if (doc.user) batchUsers.push(doc.user);

        if (batchIds.length >= BATCH_SIZE) {
          await CustomerAccount.updateMany(
            { _id: { $in: batchIds } },
            { $unset: { assignedModel: "", assigned_date: "", assigned: "" } }
          );

          if (batchUsers.length > 0) {
            await pubsub.publish(PUBSUB_EVENTS.TASK_CHANGING, {
              taskChanging: {
                members: batchUsers,
                message: PUBSUB_EVENTS.TASK_CHANGING,
              },
            });
          }

          // reset batches
          batchIds = [];
          batchUsers = [];
        }
      }

      // process remaining
      if (batchIds.length > 0) {
        await CustomerAccount.updateMany(
          { _id: { $in: batchIds } },
          { $unset: { assignedModel: "", assigned_date: "", assigned: "" } }
        );

        if (batchUsers.size > 0) {
          await pubsub.publish(PUBSUB_EVENTS.TASK_CHANGING, {
            taskChanging: {
              members: Array.from(batchUsers),
              message: PUBSUB_EVENTS.TASK_CHANGING,
            },
          });
        }
      }
    } catch (error) {
      console.error("Cron job error", error);
    }
  },
  {
    timezone: "Asia/Singapore",
  }
);

const resolvers = mergeResolvers([
  subscriptionResolvers,
  userResolvers,
  deptResolver,
  branchResolver,
  bucketResolver,
  modifyReportResolver,
  customerResolver,
  dispositionResolver,
  dispositionTypeResolver,
  groupResolver,
  taskResolver,
  productionResolver,
  callfileResolver,
  recordingsResolver,
  CustomerExtnResolver,
  callResolver,
  selectivesResolver,
  scoreCardResolver,
]);

const typeDefs = mergeTypeDefs([
  userTypeDefs,
  deptTypeDefs,
  branchTypeDefs,
  bucketTypeDefs,
  modifyReportTypeDefs,
  customerTypeDefs,
  dispositionTypeDefs,
  dispositionTypeTypeDefs,
  groupTypeDefs,
  taskTypeDefs,
  productionTypeDefs,
  callfileTypeDefs,
  recordingTypeDefs,
  subscriptionTypeDefs,
  CustomerExtnTypeDefs,
  callTypeDefs,
  selectivesTypeDefs,
  scoreCardTypeDefs,
]);

const httpServer = createServer(app);

// Allow large CSV downloads to finish even on slow networks
httpServer.setTimeout(10 * 60 * 1000);

httpServer.on("connection", (socket) => {
  socket.setMaxListeners(100);
  socket.on("error", (err) => {
    if (
      !["ECONNRESET", "ECONNABORTED", "ERR_HTTP_REQUEST_TIMEOUT"].includes(
        err.code
      )
    ) {
      console.error("❌ Socket error:", err);
    }
  });
});

const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

useServer(
  {
    schema,
    context: async (ctx, msg, args) => {
      const authHeader = ctx.connectionParams?.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new CustomError("Missing Token", 401);
      }

      const token = authHeader.split(" ")[1];
      let user = null;

      try {
        const decoded = jwt.verify(token, process.env.SECRET);
        user = await User.findById(decoded.id);
        ctx.extra.userId = decoded.id;
        const userId = user._id.toString();

        const socket = ctx.extra.socket;
        let entry = connectedUsers.get(userId);

        if (!entry) {
          connectedUsers.set(userId, {
            sockets: new Set([socket]),
            cleanupTimer: null,
          });
        } else {
          entry.sockets.add(socket);
          if (entry.cleanupTimer) {
            clearTimeout(entry.cleanupTimer);
            entry.cleanupTimer = null;
          }
        }
      } catch (err) {
        console.log("WebSocket token error:", err.message);
      }
      return { user, pubsub, PUBSUB_EVENTS };
    },

    onDisconnect: async (ctx) => {
      const socket = ctx.extra?.socket;
      const userId = ctx.extra?.userId;
      if (!userId || !socket) return;

      const entry = connectedUsers.get(userId);
      if (!entry) return;

      entry.sockets.delete(socket);
      if (entry.sockets.size === 0) {
        entry.cleanupTimer = setTimeout(async () => {
          const latest = connectedUsers.get(userId);
          if (!latest || latest.sockets.size === 0) {
            connectedUsers.delete(userId);
            const userAccounts = await User.findById(userId);

            if (userAccounts.handsOn) {
              await CustomerAccount.findByIdAndUpdate(userAccounts.handsOn, {
                $unset: {
                  on_hands: "",
                },
              });
            }

            const res = await User.findByIdAndUpdate(
              userAccounts._id,
              { $set: { isOnline: false },$unset: {handsOn: ""} },
              { new: true }
            ).populate("buckets");

            const startToday = new Date();
            startToday.setHours(0, 0, 0, 0);
            const endToday = new Date();
            endToday.setHours(23, 59, 59, 999);

            const prodRes = await Production.findOne({
              user: new mongoose.Types.ObjectId(userId),
              createdAt: { $gt: startToday, $lt: endToday },
            });

            if (prodRes) {
              const newStart = new Date();

              prodRes.prod_history = (prodRes.prod_history || []).map(
                (prod) => {
                  if (prod.existing === true) {
                    return {
                      ...prod,
                      existing: false,
                      end: new Date(),
                    };
                  }
                  return prod;
                }
              );

              prodRes.prod_history.push({
                type: "LOGOUT",
                start: newStart,
                existing: true,
              });

              await prodRes.save();
            }

            const bucket =
              res?.buckets?.length > 0
                ? new Array(...new Set(res?.buckets?.map((x) => x.viciIp)))
                : [];

            const bucketCanCall = res?.buckets.map((x) => x.canCall);

            if (bucketCanCall.includes(true)) {
              const chechIfisOnline = await Promise.all(
                bucket.map(async (x) => {
                  const result = await checkIfAgentIsOnline(res?.vici_id, x);
                  return result;
                })
              );

              await logoutVici(
                res.vici_id,
                bucket[chechIfisOnline.indexOf(true)]
              );
            }

            await pubsub.publish(PUBSUB_EVENTS.OFFLINE_USER, {
              accountOffline: {
                agentId: userId,
                message: PUBSUB_EVENTS.OFFLINE_USER,
              },
            });
          }
        }, 120000);
      }
    },

    onError: (ctx, msg, errors) => {
      console.error("GraphQL WebSocket error:", errors);
    },
    keepAlive: 12000,
  },
  wsServer
);

wsServer.setMaxListeners(50);

const startServer = async () => {
  const server = new ApolloServer({
    schema,
  });

  try {
    await server.start();
    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req, res }) => {
          const sessionUser = req.session?.user;
          let user = null;
          if (sessionUser) {
            try {
              user = await User.findById(sessionUser._id);
              return { user, res, req, pubsub, PUBSUB_EVENTS };
            } catch (error) {
              console.log(error.message);
            }
          }
          return { user, res, req, pubsub, PUBSUB_EVENTS };
        },
      })
    );

    httpServer.listen(process.env.PORT, "0.0.0.0", () => {
      console.log(
        `🚀 Server running at http://localhost:${process.env.PORT}/graphql`
      );
      console.log("📂 Serving static files from /public");
    });
  } catch (error) {
    console.error("❌ Server startup error:", error.message);
  }
};

startServer();
