import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language/index.js";

export const DateTime = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 formatted date string",
  serialize(value) {
    return value instanceof Date ? value.toISOString() : null; 
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    return ast.kind === Kind.STRING ? new Date(ast.value) : null;
  }
});