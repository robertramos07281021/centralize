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
import { fileURLToPath } from "url";
import scoreCardResolver from "./graphql/resolvers/scoreCardResolver.js";
import scoreCardTypeDefs from "./graphql/schemas/scoreCardSchema.js";
import EventEmitter from "events";
import patchUpdateResolver from "./graphql/resolvers/updateResolver.js";
import patchUpdateTypeDefs from "./graphql/schemas/updateSchema.js";
import { initViciPolling } from "./middlewares/viciPolling.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

EventEmitter.defaultMaxListeners = 5000;

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
  "http://localhost:5000",
  `http://${process.env.MY_IP}:4000`,
  `http://${process.env.MY_IP}:5000`,
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
    allowedHeaders: ["Content-Type", "Authorization"],
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

let batchUsers = new Set();

cron.schedule(
  "0 0 * * *",
  async () => {
    try {
      const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const dispotype = await DispoType.findOne({ code: "PTP" });

      if (!dispotype) throw new Error("DispoType PTP not found");

      const cursor = CustomerAccount.aggregate([
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
        .cursor();

      const BATCH_SIZE = 500;
      let batchIds = [];

      for await (const doc of cursor) {
        batchIds.push(doc._id);
        if (doc.user) batchUsers.add(doc.user);

        if (batchIds.length >= BATCH_SIZE) {
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

          // reset batches correctly
          batchIds = [];
          batchUsers.clear(); // ✅
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
  patchUpdateResolver
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
  patchUpdateTypeDefs
]);

const schema = makeExecutableSchema({ typeDefs, resolvers });

const initWebSocketServer = (httpServer, schema) => {
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  wsServer.setMaxListeners(2000);

  useServer(
    {
      schema,
      // context for each WS connection
      context: async (ctx) => {
        const authHeader = ctx.connectionParams?.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          throw new CustomError("Missing Token", 401);
        }

        const token = authHeader.split(" ")[1];
        let user = null;

        try {
          const decoded = jwt.verify(token, process.env.SECRET);
          user = await User.findById(decoded.id);
          if (!user) throw new CustomError("User not found", 401);

          const userId = user?._id?.toString();
          const socket = ctx?.extra?.socket;

          // Add socket to connectedUsers
          if (!connectedUsers.has(userId)) {
            connectedUsers.set(userId, {
              sockets: new Set([socket]),
              cleanupTimer: null,
            });
          } else {
            const entry = connectedUsers.get(userId);
            entry?.sockets?.add(socket);
            if (entry?.cleanupTimer) {
              clearTimeout(entry.cleanupTimer);
              entry.cleanupTimer = null;
            }
          }

          ctx.extra.userId = userId;

          return { user, pubsub, PUBSUB_EVENTS };

        } catch (err) {
          throw new CustomError(err.message,500);
        }
      },

      // disconnect logic
      onDisconnect: async (ctx) => {
        const socket = ctx.extra?.socket;
        const userId = ctx.extra?.userId;
        if (!userId || !socket) return;

        const entry = connectedUsers.get(userId);
        if (!entry) return;

        // remove this socket
        entry.sockets.delete(socket);

        // user still has active connections
        if (entry.sockets.size > 0) return;

        // start cleanup timer
        if (entry.cleanupTimer) clearTimeout(entry.cleanupTimer);

        entry.cleanupTimer = setTimeout(async () => {
          try {
            const latest = connectedUsers.get(userId);
            if (latest && latest.sockets.size > 0) return;

            // remove from map
            connectedUsers.delete(userId);

            const userAccount = await User.findById(userId);
            if (!userAccount) return;

            // release handsOn customer
            if (userAccount.handsOn) {
              await CustomerAccount.updateOne(
                { _id: userAccount.handsOn, on_hands: userId },
                { $unset: { on_hands: "" } }
              );
            }

            // mark offline
            const updatedUser = await User.findByIdAndUpdate(
              userId,
              {
                $set: { isOnline: false },
                $unset: { handsOn: "", "features.token": "" },
              },
              { new: true }
            ).populate("buckets");

            // close today's production
            const startToday = new Date();
            startToday.setHours(0, 0, 0, 0);
            const endToday = new Date();
            endToday.setHours(23, 59, 59, 999);

            const prodRes = await Production.findOne({
              user: userId,
              createdAt: { $gte: startToday, $lte: endToday },
            });

            if (prodRes) {
              prodRes.prod_history = (prodRes.prod_history || []).map((prod) =>
                prod.existing
                  ? { ...prod, existing: false, end: new Date() }
                  : prod
              );
              prodRes.prod_history.push({
                type: "LOGOUT",
                start: new Date(),
                existing: true,
              });
              await prodRes.save();
            }

            // VICIDIAL logout
            const buckets = updatedUser?.buckets || [];
            if (buckets.length > 0) {
              const viciIps = [...new Set(buckets.map((x) => x.viciIp))];
              const canCall = buckets.some((x) => x.canCall);
              if (canCall) {
                const statusChecks = await Promise.all(
                  viciIps.map((ip) =>
                    checkIfAgentIsOnline(updatedUser.vici_id, ip)
                  )
                );
                const onlineIndex = statusChecks.indexOf(true);
                if (onlineIndex !== -1) {
                  await logoutVici(updatedUser.vici_id, viciIps[onlineIndex]);
                }
              }
            }

            // notify offline
            await pubsub.publish(PUBSUB_EVENTS.OFFLINE_USER, {
              accountOffline: {
                agentId: userId,
                message: PUBSUB_EVENTS.OFFLINE_USER,
              },
            });

          } catch (err) {
            console.error("WS cleanup error:", err);
          }
        }, 120000); // 2 min delay
      },

      onError: (ctx, msg, errors) => {
        console.error("GraphQL WS error:", errors);
      },

      keepAlive: 12000,
    },
    wsServer
  );

  return wsServer;
};

const httpServer = createServer(app);

initWebSocketServer(httpServer, schema);

httpServer.setTimeout(10 * 60 * 1000);

httpServer.on("connection", (socket) => {
  socket.setMaxListeners(1000);
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
          const authHeader = req.headers?.authorization;
    
          if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
              const decoded = jwt.verify(token, process.env.SECRET);
              user = await User.findById(decoded.id);
            } catch (err) {
              user = null;
            }
          }

          if (sessionUser) {
            user = user || (await User.findById(sessionUser._id));
          }
          return { user, res, req, pubsub, PUBSUB_EVENTS };
        },
      })
    );

    initViciPolling()

    httpServer.listen(process.env.PORT, () => {
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
