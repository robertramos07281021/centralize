import net from 'net'

// --- Configuration ---
const GATEWAY_IP = '172.20.21.143'; 
const API_PORT = 8080; 
const API_PASSWORD = 'd41d8cd98f00b204e9800998ecf8427e'; // Use the password you set in the web interface
const CALL_DETAILS = {
  port: 1,           
  number: '09126448847',  
};
// --- End Configuration ---

const client = new net.Socket();

client.connect(API_PORT, GATEWAY_IP, () => {
  console.log('Connected to Dinstar gateway.');
  
  // 1. Authenticate with the API password
  const authCommand = `Password:${API_PASSWORD}\r\n`;
  client.write(authCommand);
});

client.on('data', (data) => {
  const response = data.toString().trim();
  console.log(`Received from gateway: "${response}"`);

  if (response === 'OK') {
    // If authentication or port selection was successful, proceed with the next command
    if (!client.portSelected) {
      console.log('Authentication successful. Sending port selection command...');
      const portCommand = `Port:${CALL_DETAILS.port}\r\n`;
      client.write(portCommand);
      client.portSelected = true;
    } else {
      console.log('Port selected. Sending dial command...');
      const dialCommand = `ATD${CALL_DETAILS.number};\r\n`;
      client.write(dialCommand);
      // Wait for the final OK or FAIL response before closing
    }
  } else if (response.includes('FAIL')) {
    console.error(`Error from gateway: ${response}. Closing connection.`);
    client.end();
  } else if (response === 'RING') {
      console.log('Call is ringing...');
  } else if (response === 'NO CARRIER') {
      console.log('Call ended or failed.');
      client.end();
  }
});

client.on('close', () => {
  console.log('Connection to gateway closed.');
});

client.on('error', (err) => {
  console.error('Connection error:', err);
});