import CustomError from "../../middlewares/errors.js";
import Group from "../../models/group.js";
import User from "../../models/user.js";
import CustomerAccount from "../../models/customerAccount.js";

const groupResolver = {
  Query: {
    findGroup: async (_, __, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      try {
        const getAllGroup = await Group.find({ createdBy: user._id });
        return getAllGroup;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
  GroupTask: {
    members: async (parent) => {
      try {
        const members = await User.find({ _id: { $in: parent.members } });
        return members;
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
  Mutation: {
    createGroup: async (_, { name, description }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      try {
        await Group.create({ name, description, createdBy: user._id });
        return { success: true, message: `Group successfully created` };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    updateGroup: async (_, { id, name, description }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      try {
        await Group.findByIdAndUpdate(id, { $set: { name, description } });
        return { success: true, message: `Group successfully updated` };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    deleteGroup: async (_, { id }, { user }) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      try {
        const deletedGroup = await Group.findByIdAndDelete(id);
        if (!deletedGroup) throw new CustomError("Group successfully deleted");

        await User.updateMany(
          { _id: { $in: deletedGroup.members } },
          { $set: { group: null } }
        );
        await CustomerAccount.updateMany(
          { assigned: deletedGroup._id },
          { $unset: { assigned: "", assigned_date: "", assignedModel: "" } }
        );
        return {
          success: true,
          message: "Group successfully deleted",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    addGroupMember: async (
      _,
      { id, member },
      { user, pubsub, PUBSUB_EVENTS }
    ) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      try {
        const findGroup = await Group.findById(id);
        if (!findGroup) throw new CustomError("Group not found", 404);

        const updateAgentGroup = await User.findByIdAndUpdate(member, {
          $set: { group: findGroup._id },
        });

        if (!updateAgentGroup) throw new CustomError("Username not found", 404);

        findGroup.members.push(member);
        await findGroup.save();

        await pubsub.publish(PUBSUB_EVENTS.GROUP_CHANGING, {
          groupChanging: {
            members: [member],
            message: PUBSUB_EVENTS.GROUP_CHANGING,
          },
        });

        return {
          success: true,
          message: `Member successfully added`,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    deleteGroupMember: async (
      _,
      { id, member },
      { user, pubsub, PUBSUB_EVENTS }
    ) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      try {
        const updateGroup = await Group.findByIdAndUpdate(id, {
          $pull: { members: member },
        });

        if (!updateGroup) throw new CustomError("Group not found", 404);

        const updateUser = await User.findByIdAndUpdate(member, {
          $set: { group: null },
        });
        if (!updateUser) throw new CustomError("User not found", 404);

        await pubsub.publish(PUBSUB_EVENTS.GROUP_CHANGING, {
          groupChanging: {
            members: [member],
            message: PUBSUB_EVENTS.GROUP_CHANGING,
          },
        });

        return {
          success: true,
          message: `Member successfully deleted`,
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    addGroupTask: async (
      _,
      { groupId, task },
      { user, pubsub, PUBSUB_EVENTS }
    ) => {
      if (!user) throw new CustomError("Unauthorized", 401);
      try {
        const findGroup = await Group.findById(groupId);
        const user = await User.findById(groupId);
        const id = findGroup ? findGroup._id : user._id;
        const CheckAssgined = findGroup ? "Group" : "User";

        await CustomerAccount.updateMany(
          { _id: { $in: task } },
          {
            $set: {
              assigned: id,
              assigned_date: new Date(),
              assignedModel: CheckAssgined,
            },
          }
        );

        await pubsub.publish(PUBSUB_EVENTS.TASK_CHANGING, {
          taskChanging: {
            members: [id],
            message: PUBSUB_EVENTS.TASK_CHANGING,
          },
        });

        return {
          success: true,
          message: "Task successfully added",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
    deleteGroupTask: async (_, { caIds }, { pubsub, PUBSUB_EVENTS }) => {
      try {
        const findAccounts = await CustomerAccount.find({
          _id: { $in: caIds },
        });
        await Promise.all(
          findAccounts.map(async (e) => {
            await CustomerAccount.findByIdAndUpdate(e._id, {
              $set: { assigned: null, assigned_date: null, assignedModel: "" },
            });
          })
        );

        const agent = new Set(findAccounts.map((e) => e.assigned));
        await pubsub.publish(PUBSUB_EVENTS.TASK_CHANGING, {
          taskChanging: {
            members: agent,
            message: PUBSUB_EVENTS.TASK_CHANGING,
          },
        });

        return {
          success: true,
          message: "Assigned successfully removed",
        };
      } catch (error) {
        throw new CustomError(error.message, 500);
      }
    },
  },
};

export default groupResolver;
