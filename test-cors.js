const https = require('https');

const options = {
  hostname: 'gigshield-api-gvim.onrender.com',
  port: 443,
  path: '/api/worker/register',
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://gig-shield-ten.vercel.app',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type'
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:');
  console.log(res.headers);
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
