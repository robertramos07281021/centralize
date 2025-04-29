import "dotenv/config.js";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { mergeResolvers } from "@graphql-tools/merge";
import { mergeTypeDefs } from "@graphql-tools/merge";
import cors from "cors"
import bodyParser from "body-parser";
import { expressMiddleware } from "@apollo/server/express4";
import connectDB from "./dbConnection/_db.js";
import User from "./models/user.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
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



const app = express()
connectDB()

const resolvers = mergeResolvers([userResolvers, deptResolver, branchResolver, bucketResolver, modifyReportResolver, customerResolver, dispositionResolver, dispositionTypeResolver, groupResolver, taskResolver]);

const typeDefs = mergeTypeDefs([userTypeDefs, deptTypeDefs, branchTypeDefs, bucketTypeDefs, modifyReportTypeDefs, customerTypeDefs, dispositionTypeDefs, dispositionTypeTypeDefs, groupTypeDefs, taskTypeDefs]);

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,              
}));
app.use(bodyParser.json());
app.use(cookieParser())

const startServer = async() => {
  const server = new ApolloServer({
    typeDefs, resolvers
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
            console.log("Invalid Token:", error.message);
          }
          return { res };
        },
      })
    );
    

    app.listen(4000, () => {
      console.log("🚀 Server running at http://localhost:4000/graphql");
      console.log("📂 Serving static files from /public");
    });

  } catch (error) {
    console.error("❌ Server startup error:", error.message);
  }
}

startServer()
