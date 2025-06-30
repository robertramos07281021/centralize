import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub()

pubsub.ee.setMaxListeners(100);

export default pubsub