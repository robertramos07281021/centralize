import "dotenv/config.js";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import cors from "cors"
import bodyParser from "body-parser";
import { expressMiddleware } from "@apollo/server/express4";
import connectDB from "./dbConnection/_db.js";
import User from "./models/user.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import { useServer } from 'graphql-ws/use/ws';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { makeExecutableSchema } from '@graphql-tools/schema';

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

// import { fileURLToPath } from "url";
// import path from "path";


const app = express()
connectDB()

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json())
app.use(cookieParser())


// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// app.use(express.static(path.join(__dirname, "/client/dist")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "/client/dist/index.html"));
// });


const resolvers = mergeResolvers([userResolvers, deptResolver, branchResolver, bucketResolver, modifyReportResolver, customerResolver, dispositionResolver, dispositionTypeResolver, groupResolver, taskResolver,productionResolver]);

const typeDefs = mergeTypeDefs([userTypeDefs, deptTypeDefs, branchTypeDefs, bucketTypeDefs, modifyReportTypeDefs, customerTypeDefs, dispositionTypeDefs, dispositionTypeTypeDefs, groupTypeDefs, taskTypeDefs, productionTypeDefs]);

const httpServer = createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });


const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

useServer({ schema,
  context: async (ctx, msg, args) => {
    const auth = ctx.connectionParams?.Authorization || "";
    const token = auth.replace("Bearer ", "");

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SECRET);
        const user = await User.findById(decoded.id);
        return { user };
      } catch (err) {
        console.log("WebSocket token error:", err.message);
      }
    }

    return {user: null };
  }
 }, wsServer);

const startServer = async() => {
  const server = new ApolloServer({
    schema
  })

  try {
    await server.start()

    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req, res }) => {
          try {
            const token = req.cookies?.token;
            if (token) {
              const decoded = jwt.verify(token, process.env.SECRET);
              const user = await User.findById(decoded.id);
              return { user, res };
            }
          } catch (error) {
            console.log(error.message)
          }
          return { user: null, res};
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
