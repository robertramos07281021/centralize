import axios from "axios";

const UC2000_IP = "172.20.21.87"; // change to your gateway IP
const UC_USER = "admin";           // your API username
const UC_PASS = "admin";           // your API password

export async function getPortInfo(port) {
  try {
    const res = await axios.post(
      `http://${UC2000_IP}/api`,
      { action: "GetPortInfo", port },
      {
        auth: { username: UC_USER, password: UC_PASS },
        headers: { "Content-Type": "application/json" },
        timeout: 3000,
      }
    );

    return res.data; // returns JSON from the UC2000
  } catch (err) {
    console.error(`❌ UC2000 port ${port} error:`, err.message);
    return null;
  }
}