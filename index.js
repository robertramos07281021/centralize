import "dotenv/config.js";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import cors from "cors"
import { expressMiddleware } from "@apollo/server/express4";
import connectDB from "./dbConnection/_db.js";
import User from "./models/user.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import { useServer } from 'graphql-ws/use/ws';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cookie from 'cookie'
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

const app = express()
connectDB()



app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser())
app.use(compression())
// app.use(
//   session({
//     secret: process.env.SECRET,
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//       maxAge: 1000 * 60 * 60 * 24,
//       secure: false,
//       httpOnly: true,
//     },
//   })
// );

const resolvers = mergeResolvers([userResolvers, deptResolver, branchResolver, bucketResolver, modifyReportResolver, customerResolver, dispositionResolver, dispositionTypeResolver, groupResolver, taskResolver,productionResolver,callfileResolver, recordingsResolver]);

const typeDefs = mergeTypeDefs([userTypeDefs, deptTypeDefs, branchTypeDefs, bucketTypeDefs, modifyReportTypeDefs, customerTypeDefs, dispositionTypeDefs, dispositionTypeTypeDefs, groupTypeDefs, taskTypeDefs, productionTypeDefs, callfileTypeDefs, recordingTypeDefs]);

const httpServer = createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

useServer({ schema,
  context: async (ctx, msg, args) => {
    const cookieHeader  = ctx.extra.request.headers.cookie || '';

    const cookies = cookie.parse(cookieHeader)

    let user = null

    const token = cookies.token
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SECRET);
        user = await User.findById(decoded.id);
        ctx.extra.userId = decoded.id;
        return { user };
      } catch (err) {
        console.log("WebSocket token error:", err.message);
      }
    }
    return { user };
  },
  onDisconnect: async (ctx, code, reason) => {
    const userId = ctx.extra?.userId;
    if (userId) {
      try {
        if(code === 1001 || code === 1006) {
          await User.findByIdAndUpdate(userId, { isOnline: false });
        }
      } catch (err) {
        console.error("onDisconnect error:", err.message);
      }
    }
  }
 }, wsServer);

const startServer = async() => {
  const server = new ApolloServer({
    schema,
  })

  try {
    await server.start()

    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req, res }) => {
     
          const token = req.cookies?.token;
          // const sessionUser = req.session?.user;
          let user = null
          // if (sessionUser) {
          if (token) {
            try {
              const decoded = jwt.verify(token, process.env.SECRET);
              user = await User.findById(decoded.id);
              return { user, res, req };
            } catch (error) {
              console.log(error.message);
            }
          }
          // }
          return { user, res, req};
        },
      })
    );
    
    httpServer.listen(process.env.PORT, () => {
      console.log(`🚀 Server running at http://localhost:${process.env.PORT}/graphql`);
      console.log("📂 Serving static files from /public");
    });

  } catch (error) {
    console.error("❌ Server startup error:", error.message);
  }
}

startServer()
