import axios from "axios";
import "dotenv/config.js"

/**
 * Trigger a Vicidial external dial
 * @param {string} agentUser - Agent username in Vicidial
 * @param {string} phoneNumber - Customer number
 * @returns {string} SUCCESS or ERROR message from Vicidial
 */


const credentials = {
  source: "NodeApp",
  user: process.env.VICIDIAL_ADMIN_USER,
  pass: process.env.VICIDIAL_ADMIN_PASS,
};



export async function callViaVicidial(agentUser, phoneNumber,vici_id) {

  const VICIDIAL_API = `http://${vici_id}/agc/api.php`;

  const params = {
    ...credentials,
    function: 'external_dial',
    agent_user: agentUser,
    value: phoneNumber,
    phone_code: '63',   
    search: 'YES',
    preview: 'NO',
    focus: 'YES'
  };

 try {
    const res = await axios.get(VICIDIAL_API, { params });
    const data = res.data;

    return { success: true, message: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// export async function checkIfAgentFree(agentUser) {
//   const params = {
//     ...credentials,
//     function: "calls_in_queue_count",
//     agent_user: agentUser,
//   }
//   const {data} = await axios.get(VICIDIAL_API, { params })

//   return data.includes("|0|")
// }

export async function setDisposition(value, agent_user) {

  return axios.get(VICIDIAL_API, {
    params: {
      ...credentials,
      function: "external_status",
      agent_user,
      value,
    },
  });
}

export async function checkIfAgentIsOnline(agentUser,vici_id) {

  if (!agentUser || agentUser.trim() === "") {
    throw new Error("Agent user is required");
  }

  const VICIDIAL_API = `http://${vici_id}/agc/api.php`;

  const { data } = await axios.get(VICIDIAL_API, {
    params: {
      ...credentials,
      agent_user: agentUser.trim(),
      function: "calls_in_queue_count", // ✅ removed trailing space
      value: "DISPLAY",
    },
  });


  const response = data.trim().toLowerCase();

  // ✅ return only boolean
  if (response.includes("not logged in")) return false;
  if (response.includes("success")) return true;

  return false;
}