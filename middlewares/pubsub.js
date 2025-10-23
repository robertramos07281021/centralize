import { PubSub } from "graphql-subscriptions";

const pubsub = new PubSub()

pubsub.ee.setMaxListeners(1000);

export default pubsub