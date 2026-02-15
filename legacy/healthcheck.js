const http = require('http');
const config = require('./config');

const options = {
  hostname: config.server.host,
  port: config.server.port,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  /* eslint-disable no-console */
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.log(`Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
  /* eslint-enable no-console */
});

req.on('error', (error) => {
  /* eslint-disable no-console */
  console.log(`Health check failed: ${error.message}`);
  /* eslint-enable no-console */
  process.exit(1);
});

req.on('timeout', () => {
  /* eslint-disable no-console */
  console.log('Health check timed out');
  /* eslint-enable no-console */
  req.destroy();
  process.exit(1);
});

req.end();