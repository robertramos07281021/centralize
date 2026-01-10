import axios from "axios";
import "dotenv/config.js";

/**
 * Trigger a Vicidial external dial
 * @param {string} agentUser - Agent username in Vicidial
 * @param {string} phoneNumber - Customer number
 * @returns {string} SUCCESS or ERROR message from Vicidial
 */

const viciAuto = [
  "172.20.21.64",
  "172.20.21.91",
  "172.20.21.70",
  "172.20.21.85",
  "172.20.21.76",
  "172.20.21.15",
];

const credentials = {
  source: "NodeApp",
  user: process.env.VICIDIAL_ADMIN_USER,
};

// const mobileNo =
//   userLogged?.username === "RRamos" ? "09285191305" : "09694827149";

const passwordNonAuto = process.env.VICIDIAL_ADMIN_PASS;
const passwordAuto = process.env.VICIDIAL_ADMIN_PASS_A;

const normalizeViciId = (vici_id) => {
  const id = typeof vici_id === "string" ? vici_id.trim() : "";
  return id || null;
};

export async function callViaVicidial(agentUser, phoneNumber, vici_id) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId) return { success: false, message: "Missing Vici ID" };

  const VICIDIAL_API = `http://${safeViciId}/agc/api.php`;

  const isProd =
    process.env.NODE_ENV === "production"
      ? phoneNumber
      : agentUser === "5555"
      ? process.env.EDRIAN
      : process.env.ME;

  const params = {
    ...credentials,
    pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
    function: "external_dial",
    agent_user: agentUser,
    value: isProd,
    phone_code: "63",
    search: "YES",
    preview: "NO",
    focus: "YES",
  };

  try {
    const res = await axios.get(VICIDIAL_API, { params });
    const data = res.data;
    return { success: true, message: data };
  } catch (err) {
    console.error("❌ Error Call vici", err.message);
  }
}

export async function checkIfAgentIsOnline(agentUser, vici_id) {
  try {
    const safeViciId = normalizeViciId(vici_id);
    if (!safeViciId) return false;

    if (!agentUser || agentUser.trim() === "") {
      return false;
    }
    const VICIDIAL_API = `http://${safeViciId}/agc/api.php`;

    const { data } = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        agent_user: agentUser.trim(),
        function: "calls_in_queue_count",
        value: "DISPLAY",
      },
    });

    const response = data.trim().toLowerCase();

    if (response.includes("not logged in")) return false;
    if (response.includes("success")) return true;

    return false;
  } catch (error) {
    console.error("❌ Error checkingAgentIsOnline:", error.message);
  }
}

export async function endAndDispo(agentUser, vici_id) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId) return;

  const VICIDIAL_API = `http://${safeViciId}/agc/api.php`;

  try {
    await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        agent_user: agentUser,
        function: "external_pause",
        value: "PAUSE",
      },
    });

    await new Promise((res) => setTimeout(res, 1000));

    await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        agent_user: agentUser,
        function: "external_hangup",
        value: 1,
      },
    });

    await new Promise((res) => setTimeout(res, 1000));

    await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        agent_user: agentUser,
        function: "external_status",
        value: "A",
      },
    });
  } catch (err) {
    console.error("❌ Error End Dispo:", err.message);
  }
}

export async function checkIfAgentIsInlineOnVici(agentUser, vici_id) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId) return null;

  const VICIDIAL_API = `http://${safeViciId}/vicidial/non_agent_api.php`;
  try {
    const res = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        function: "agent_status",
        agent_user: agentUser,
        state: "csv",
      },
    });

    const data = res.data;

    return data;
  } catch (error) {
    console.error("❌ Error Check If Agent Is Inline:", error.message);
  }
}

export async function logoutVici(agentUser, vici_id) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId) return;

  const VICIDIAL_API = `http://${safeViciId}/agc/api.php`;
  try {
    const res = await checkIfAgentIsOnline(agentUser, safeViciId);
    if (res) {
      await axios.get(VICIDIAL_API, {
        params: {
          ...credentials,
          pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
          agent_user: agentUser,
          function: "logout",
          value: "LOGOUT",
        },
      });
    }
  } catch (error) {
    console.error("❌ Error Logout Vici:", error.message);
  }
}

export async function getRecordings(vici_id, agent_user, dateFilter) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId) return null;

  const VICIDIAL_API = `http://${safeViciId}/vicidial/non_agent_api.php`;
  try {
    const date = new Date();
    const year = date.getFullYear();
    const day = date.getDate();
    const month = date.getMonth() + 1;

    const { data } = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        function: "recording_lookup",
        date: dateFilter
          ? dateFilter
          : `${year}-${month.toString().padStart(2, "0")}-${day
              .toString()
              .padStart(2, "0")}`,
        agent_user,
        duration: "Y",
      },
    });

    return data;
  } catch (error) {
    console.error("❌ Error Get Recordings:", error.message);
  }
}

export async function getUserInfo(vici_id, agent_user) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId) return null;

  const VICIDIAL_API = `http://${safeViciId}/vicidial/non_agent_api.php`;
  try {
    if (!safeViciId) return null;

    const { data } = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        function: "agent_status",
        agent_user,
        stage: "csv",
        header: "YES",
        include_ip: "YES",
      },
    });
    return data;
  } catch (error) {
    console.log(error);
    console.error("❌ Error Get UserInfo:", error.message);
  }
}

export async function getLoggedInUser(vici_id) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId) return null;

  const VICIDIAL_API = `http://${safeViciId}/vicidial/non_agent_api.php`;
  try {
    const { data } = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        function: "logged_in_agents",
        header: "YES",
        show_sub_status: "YES",
      },
    });

    return data;
  } catch (error) {
    console.log(error);
    console.error("❌ Error Get getLoggedInUser:", error.message);
  }
}

export async function bargeUser(vici_id, session_id, barger_phone) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId || !session_id) return null;

  const VICIDIAL_API = `http://${safeViciId}/vicidial/non_agent_api.php`;
  try {
    const res = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        function: "blind_monitor",
        phone_login: barger_phone,
        session_id: session_id,
        server_ip: safeViciId,
        state: "BARGE",
      },
    });

    return res.data;
  } catch (error) {
    console.error("❌ Error Get bargeUser:", error.message);
  }
}

export async function getCallInfo(vici_id, call_id, session_id) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId || !session_id) return null;

  const VICIDIAL_API = `http://${safeViciId}/vicidial/non_agent_api.php`;
  try {
    const res = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        function: "callid_info ",
        call_id: call_id,
        session_id: session_id,
        detail: "YES",
        stage: "csv",
      },
    });
    // console.log(res.data)
    return res.data;
  } catch (error) {
    console.error("❌ Error Get getCallInfo:", error.message);
  }
}

export async function checkingLiveCall(vici_id, agent_user) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId) return null;

  const VICIDIAL_API = `http://${safeViciId}/agc/api.php`;
  try {
    const res = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        function: "live_agent_status",
        agent_user: agent_user,
      },
    });

    return res.data;
  } catch (error) {
    console.error("❌ Error Logout Vici:", error.message);
  }
}

export async function findMobileRecordings(vici_id, phone) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId || !session_id) return null;

  const VICIDIAL_API = `http://${safeViciId}/vicidial/non_agent_api.php`;

  try {
    const res = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        function: "phone_number_log ",
        stage: "pipe",
        agent_user: phone,
      },
    });

    return res.data;
  } catch (error) {
    console.error("❌ Error Logout Vici:", error.message);
  }
}

export async function checkViciPhoneNumberLog(vici_id, phone) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId || !session_id) return null;

  const VICIDIAL_API = `http://${safeViciId}/vicidial/non_agent_api.php`;

  try {
    const res = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        function: "phone_number_log",
        phone_number: phone,
        stage: "pipe",
        detail: "LAST",
      },
    });

    return res.data;
  } catch (error) {
    console.error("❌ Error Logout Vici:", error.message);
  }
}

export async function bucketUsersStatus(vici_id) {
  const safeViciId = normalizeViciId(vici_id);
  if (!safeViciId) return null;

  const VICIDIAL_API = `http://${safeViciId}/vicidial/non_agent_api.php`;
  try {
    const today = new Date().toISOString().split('T')[0];

    const res = await axios.get(VICIDIAL_API, {
      params: {
        ...credentials,
        pass: viciAuto.includes(safeViciId) ? passwordAuto : passwordNonAuto,
        function: "agent_stats_export",
        stage: "pipe",
        time_format: "M",
        datetime_start: `${today}+00:00:00`,
        datetime_end: `${today}+23:59:59`,
      },
    });

    return res.data;
  } catch (error) {
    console.error("❌ Error Logout Vici:", error.message);
  }
}
