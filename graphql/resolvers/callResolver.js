import { makeCall } from "../../middlewares/asterisk.js";
import CustomError from "../../middlewares/errors.js";


const callResolver = {
 
  Mutation: {
    makeCall: async(_, { phoneNumber }) => {
    try {
      const response = await makeCall(phoneNumber);
      return `Call initiated successfully: ${JSON.stringify(response)}`;
    } catch (err) {
      console.error('Error making call:', err);
      throw new CustomError('Failed to initiate call',500);
    }
  },
  }
}

export default callResolver