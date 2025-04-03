import { gql } from "graphql-tag";

const dispositionTypeDefs = gql`
  scalar DateTime
  type Disposition {
    id:ID
    amount: Float
    disposition: String
    payment_date: String
    ref_no: String
  }
  
  type Success {
    success: Boolean!
    message: String!
  }
  
  type Query {
    getAccountDispositions(id:ID!):[Disposition]

  }

  # type Mutation {

  # }
`

export default dispositionTypeDefs



// mount: {
//       type: Number,
//       required: true,
//     },

//     customer_account: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "CustomerAccount",
//       required: true
//     },
//     disposition: {
//       type: String,
//       required: true
//     },
//     payment_date: {
//       type: String,
//       required: true
//     },
//     payment_method: {
//       type: String,
//       required: true
//     },
//     ref_no: {
//       type: String,
//       required: true
//     },
//     comment: {
//       type: String
//     },
//     existing: {
//       type: Boolean,
//       default: true
//     },
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true
//     }