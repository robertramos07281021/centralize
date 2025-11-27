import CustomError from "../../middlewares/errors.js";
import ScoreCardData from "../../models/scoreCardData.js";

const scoreCardResolver = {
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
        } = input;

        if (
          !month ||
          !department ||
          !agentName ||
          !dateAndTimeOfCall ||
          !number
        ) {
          throw new CustomError("Missing required fields", 400);
        }

        if (assignedQA && assignedQA !== user._id.toString()) {
          throw new CustomError("Invalid assigned QA", 403);
        }

        const parsedDate = new Date(dateAndTimeOfCall);
        if (Number.isNaN(parsedDate.getTime())) {
          throw new CustomError("Invalid date value", 400);
        }

        const payload = {
          month,
          department,
          agentName,
          dateAndTimeOfCall: parsedDate,
          number,
          assignedQA: user._id,
          typeOfScoreCard: typeOfScoreCard || "Default Score Card",
        };

        const createdRecord = await ScoreCardData.create(payload);
        return createdRecord;
      } catch (error) {
        console.log(error);
        if (error instanceof CustomError) {
          throw error;
        }
        throw new CustomError(error.message, 500);
      }
    },
  },
};

export default scoreCardResolver;
