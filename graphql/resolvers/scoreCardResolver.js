import CustomError from "../../middlewares/errors.js";
import ScoreCardData from "../../models/scoreCardData.js";
import GraphQLJSON from "graphql-type-json";

const serializeDate = (value) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const scoreCardResolver = {
  JSON: GraphQLJSON,
  Query: {
    getScoreCardSummaries: async (_, { date, search }, { user }) => {
      try {
        if (!user) {
          throw new CustomError("Not authenticated", 401);
        }

        const query = {};
        if (date) {
          const parsedDate = new Date(date);
          if (Number.isNaN(parsedDate.getTime())) {
            throw new CustomError("Invalid date value", 400);
          }
          const startOfDay = new Date(parsedDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(parsedDate);
          endOfDay.setHours(23, 59, 59, 999);
          query.createdAt = {
            $gte: startOfDay,
            $lte: endOfDay,
          };
        }

        const records = await ScoreCardData.find(query)
          .sort({ createdAt: -1 })
          .limit(100)
          .populate({ path: "agentName", select: "name type" })
          .populate({ path: "assignedQA", select: "name type" })
          .populate({ path: "department", select: "name" })
          .lean();

        const normalizedSearch = search?.trim().toLowerCase();
        const filteredRecords = normalizedSearch
          ? records.filter((record) => {
              const agentName = record.agentName?.name?.toLowerCase() ?? "";
              const scoreType = record.typeOfScoreCard?.toLowerCase() ?? "";
              const totalScore =
                typeof record.totalScore === "number"
                  ? record.totalScore.toString()
                  : "";
              return (
                agentName.includes(normalizedSearch) ||
                scoreType.includes(normalizedSearch) ||
                totalScore.includes(normalizedSearch)
              );
            })
          : records;

        return filteredRecords.map((record) => {
          const {
            agentName,
            assignedQA,
            department,
            dateAndTimeOfCall,
            createdAt,
            updatedAt,
            ...rest
          } = record;
          return {
            ...rest,
            dateAndTimeOfCall: serializeDate(dateAndTimeOfCall),
            createdAt: serializeDate(createdAt),
            updatedAt: serializeDate(updatedAt),
            agent: agentName ?? null,
            qa: assignedQA ?? null,
            department: department ?? null,
          };
        });
      } catch (error) {
        if (error instanceof CustomError) {
          throw error;
        }
        throw new CustomError(error.message, 500);
      }
    },
  },
  Mutation: {
    createScoreCardData: async (_, { input }, { user }) => {
      try {
        if (!user) {
          throw new CustomError("Not authenticated", 401);
        }

        const {
          month,
          department,
          agentName,
          dateAndTimeOfCall,
          number,
          assignedQA,
          typeOfScoreCard,
          scoreDetails,
          totalScore,
        } = input;

        if (
          !month ||
          !department ||
          !agentName ||
          !dateAndTimeOfCall ||
          !number ||
          scoreDetails == null ||
          typeof totalScore !== "number"
        ) {
          throw new CustomError("Missing required fields", 400);
        }

        if (typeof scoreDetails !== "object" || Array.isArray(scoreDetails)) {
          throw new CustomError("Invalid score details format", 400);
        }

        if (assignedQA && assignedQA !== user._id.toString()) {
          throw new CustomError("Invalid assigned QA", 403);
        }

        const parsedDate = new Date(dateAndTimeOfCall);
        if (Number.isNaN(parsedDate.getTime())) {
          throw new CustomError("Invalid date value", 400);
        }

        if (totalScore < 0) {
          throw new CustomError("Invalid total score", 400);
        }

        const payload = {
          month,
          department,
          agentName,
          dateAndTimeOfCall: parsedDate,
          number,
          assignedQA: user._id,
          typeOfScoreCard: typeOfScoreCard || "Default Score Card",
          scoreDetails,
          totalScore,
        };

        const createdRecord = await ScoreCardData.create(payload);

        return createdRecord;
      } catch (error) {
        if (error instanceof CustomError) {
          throw error;
        }
        throw new CustomError(error.message, 500);
      }
    },

    createUBScoreCardData: async (_, { input }, context) => {
      return scoreCardResolver.Mutation.createScoreCardData(
        _,
        { input: { ...input, typeOfScoreCard: "UB Score Card" } },
        context
      );
    },
  },
};

export default scoreCardResolver;
