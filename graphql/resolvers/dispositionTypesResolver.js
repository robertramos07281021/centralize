import CustomError from "../../middlewares/errors.js";
import DispoType from "../../models/dispoType.js";

const dispositionTypeResolver = {
  Query: {
    getDispositionTypes: async () => {
      try {
        const dipositionTypes = await DispoType.find().sort({ rank: 1 });
        return dipositionTypes;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    getDispositionTypesAll: async () => {
      try {
        const dipositionTypes = await DispoType.find().sort({ rank: 1 });
        return dipositionTypes;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
  Mutation: {
    createDispositionType: async (_, { input }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const skip = input.contact_method.toString().includes("skip");
        const field = input.contact_method.toString().includes("field");
        const call = input.contact_method.toString().includes("call");
        const sms = input.contact_method.toString().includes("sms");
        const email = input.contact_method.toString().includes("email");

        const contactMethod = {
          skip,
          field,
          call,
          sms,
          email,
        };

        const newDispotype = await DispoType.create({
          ...input,
          contact_methods: contactMethod,
        });

        return {
          success: true,
          message: `${newDispotype.name} has been created`,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    updateDispositionType: async (_, { id, input }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);
        const { contact_method, ...restInput } = input;
        const skip = contact_method.toString().includes("skip");
        const field = contact_method.toString().includes("field");
        const call = contact_method.toString().includes("call");
        const sms = input.contact_method.toString().includes("sms");
        const email = input.contact_method.toString().includes("email");

        const contact_methods = {
          skip,
          field,
          call,
          sms,
          email,
        };

        const findDispoType = await DispoType.findByIdAndUpdate(
          id,
          {
            $set: {
              ...restInput,
              contact_methods: contact_methods,
            },
          },
          { new: true }
        );

        return {
          success: true,
          message: `${findDispoType.name.toUpperCase()} successfully updated`,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    activateDeactivateDispotype: async (_, { id }, { user }) => {
      try {
        if (!user) throw new CustomError("Unauthorized", 401);

        const dispotype = await DispoType.findById(id);

        if (!dispotype) throw new CustomError("Dispotype not found", 404);

        dispotype.active = !dispotype.active;
        await dispotype.save();

        return {
          success: true,
          message: `Dispotype successfully ${
            dispotype.active ? "activate" : "deactivate"
          }`,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
};

export default dispositionTypeResolver;
