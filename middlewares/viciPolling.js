// import Bucket from "../models/bucket.js";
// import User from "../models/user.js";
// import pubsub from "./pubsub.js";
// import { getLoggedInUser } from "./vicidial.js";
// import { PUBSUB_EVENTS } from "./pubsubEvents.js";

// const viciUserMap = new Map();
// let buckets = [];
// let viciIdMap = new Map();

// let staticLoopRunning = false;
// let pollLoopRunning = false;

// const STATIC_REFRESH_MS = 1000;
// const POLL_INTERVAL_MS = 1000;
// const STALE_USER_TTL_MS = 5 * 60 * 1000;

// const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// async function loadStaticData() {
//   if (staticLoopRunning) return;
//   staticLoopRunning = true;

//   while (staticLoopRunning) {
//     try {
//       buckets = await Bucket.find({ canCall: true }).lean();

//       const users = await User.find({
//         buckets: { $in: buckets.map((b) => b._id) },
//         type: { $in: ["AGENT", "TL"] },
//       }).lean();

//       viciIdMap = new Map(users.map((u) => [u.vici_id, u._id.toString()]));
//     } catch (err) {
//       console.error("Vici static refresh error:", err?.message || err);
//     }

//     await sleep(STATIC_REFRESH_MS);
//   }
// }

// async function pollViciOnce() {
//   for (const bucket of buckets) {
//     console.log('hello')
//     const rawStatus = await getLoggedInUser(bucket.viciIp);
//     if (!rawStatus || typeof rawStatus !== "string") continue;

//     const lines = rawStatus.split("\n");
//     for (const line of lines) {
//       if (!line || line.trim() === "") continue;
//       const fields = line.split("|");
//       const viciId = fields[0];
//       const status = fields[3];
//       const acctStatus = fields[fields.length - 2];
//       const subStatus = fields[fields.length - 1];
//       const userId = viciIdMap.get(viciId);

//       if (!userId) {
//         continue
//       }
//       const prev = viciUserMap.get(userId);

//       const changed =
//         !prev || prev.status !== status || prev.subStatus !== subStatus || prev.acctStatus !== acctStatus;

//       if (changed) {
//         // console.log(line)
//         viciUserMap.set(userId, {
//           userId,
//           status,
//           subStatus,
//           acctStatus,
//           bucketId: bucket._id,
//           lastSeen: Date.now(),
//         });

//         await pubsub.publish(PUBSUB_EVENTS.AGENT_STATUS_UPDATED, {
//           agentStatusUpdated: {
//             userId,
//             status,
//             subStatus,
//             acctStatus,
//           },
//         });
//       }
//     }
//   }

//   const now = Date.now();
//   for (const [userId, info] of viciUserMap.entries()) {
//     if (!info?.lastSeen || now - info.lastSeen > STALE_USER_TTL_MS) {
//       viciUserMap.delete(userId);
//     }
//   }
// }

// function startPollingLoop() {
//   if (pollLoopRunning) return;
//   pollLoopRunning = true;

//   (async () => {
//     while (pollLoopRunning) {
//       try {
//         await pollViciOnce();
//       } catch (err) {
//         console.error("Vici polling error:", err?.message || err);
//       }

//       await sleep(POLL_INTERVAL_MS);
//     }
//   })();
// }

// export async function initViciPolling() {
//   await loadStaticData();
//   startPollingLoop();
// }

import Bucket from "../models/bucket.js";
import User from "../models/user.js";
import pubsub from "./pubsub.js";
import { getLoggedInUser } from "./vicidial.js";
import { PUBSUB_EVENTS } from "./pubsubEvents.js";

const STATIC_REFRESH_MS = 1000;
const POLL_INTERVAL_MS = 1000;
const STALE_USER_TTL_MS = 5 * 60 * 1000;

const viciUserMap = new Map();
let buckets = [];
let viciIdMap = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startStaticDataLoop() {
  const refreshStaticData = async () => {
    try {
      buckets = await Bucket.find({ canCall: true }).lean();

      const users = await User.find({
        buckets: { $in: buckets.map((b) => b._id) },
        type: { $in: ["AGENT", "TL"] },
      }).lean();

      viciIdMap = new Map(users.map((u) => [u.vici_id, u._id.toString()]));
    } catch (err) {
      console.error("Vici static refresh error:", err?.message || err);
    }
  };

  refreshStaticData();
  setInterval(refreshStaticData, STATIC_REFRESH_MS);
}

// ---- Poll Vici Once ----
async function pollViciOnce() {
  for (const bucket of buckets) {
    try {
      const rawStatus = await getLoggedInUser(bucket.viciIp);
      
      if (!rawStatus || typeof rawStatus !== "string") continue;
      const lines = rawStatus.split("\n");
      
      for (const line of lines) {
        if (!line || line.trim() === "") continue;
        const fields = line.split("|");

        const viciId = fields[0];
        const status = fields[3];
        const acctStatus = fields[fields.length - 2];
        const subStatus = fields[fields.length - 1];

        const userId = viciIdMap.get(viciId);

        if (!userId) {
          continue;
        }

        const prev = viciUserMap.get(userId);
        const changed =
          !prev ||
          prev.status !== status ||
          prev.subStatus !== subStatus ||
          prev.acctStatus !== acctStatus;

        if (changed) {
          viciUserMap.set(userId, {
            userId,
            status,
            subStatus,
            acctStatus,
            bucketId: bucket._id,
            lastSeen: Date.now(),
          });

          await pubsub.publish(PUBSUB_EVENTS.AGENT_STATUS_UPDATED, {
            agentStatusUpdated: {
              userId,
              status,
              subStatus,
              acctStatus,
            },
          });
        }
      }
      // console.log(viciUserMap)
      for (const [vici_id, userId] of viciIdMap) {
        if ((!rawStatus.includes(vici_id) && !rawStatus.includes('ERROR')) || rawStatus.includes('ERROR')) {
          if (viciUserMap.has(userId)) {
            await pubsub.publish(PUBSUB_EVENTS.AGENT_STATUS_UPDATED, {
              agentStatusUpdated: {
                userId: userId,
                status: "OFFLINE",
                subStatus: "",
                acctStatus: "",
              },
            });
            viciUserMap.delete(userId);
          }
        }
      }
    } catch (err) {
      console.error(`Error polling bucket ${bucket._id}:`, err?.message || err);
    }
  }

  // Cleanup stale users
  // const now = Date.now();
  // for (const [userId, info] of viciUserMap.entries()) {
  //   if (!info?.lastSeen || now - info.lastSeen > STALE_USER_TTL_MS) {
  //     viciUserMap.delete(userId);
  //   }
  // }
}

// ---- Polling Loop ----
function startPollingLoop() {
  const loop = async () => {
    while (true) {
      try {
        await pollViciOnce();
      } catch (err) {
        console.error("Vici polling error:", err?.message || err);
      }
      await sleep(POLL_INTERVAL_MS);
    }
  };
  loop();
}

// ---- Init Function ----
export function initViciPolling() {
  startStaticDataLoop();
  startPollingLoop();
}
