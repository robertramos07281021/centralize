import AsteriskManager from 'asterisk-manager';

const ami = new AsteriskManager(
  5060,               // AMI port (default)
  '172.20.21.17',     // Issabel/Vicidial IP
  '6666',           // AMI username (from manager.conf)
  'Bernales2024', // AMI password
  true
);

ami.keepConnected();

ami.on('connect', () => {
  console.log('✅ Connected to Asterisk AMI');
});

ami.on('error', (err) => {
  console.error('❌ AMI connection failed:', err);
});


export function makeCall(number, callerId = '1000', trunk = 'dinstar-trunk') {
  return new Promise((resolve, reject) => {
    const originate = {
      Action: 'Originate',
      Channel: `SIP/${number}@${trunk}`,
      Context: 'from-internal', // change if your context differs
      Exten: number,
      Priority: 1,
      CallerID: callerId,
      Async: true,
    };

    ami.action(originate, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}
