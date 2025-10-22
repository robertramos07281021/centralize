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
const VICIDIAL_API = `http://${process.env.VICI_IP}/agc/api.php`;


export async function callViaVicidial(agentUser, phoneNumber) {
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

export async function checkIfAgentIsOnline(agentUser) {

  const { data } = await axios.get(VICIDIAL_API, {
    params: {
      ...credentials,
      agent_user: agentUser,
      function: "calls_in_queue_count ",
      value:"DISPLAY"
    },
  });

  return data
}