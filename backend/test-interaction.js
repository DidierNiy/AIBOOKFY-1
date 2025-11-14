const http = require('http');

// First, register a test user
const registerData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123',
  role: 'traveler'
});

const registerOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(registerData)
  }
};

const registerReq = http.request(registerOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Register response:', data);
    
    // After registration, try to login
    const loginData = JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
      role: 'traveler'
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const loginReq = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Login response:', data);
        const token = JSON.parse(data).token;
        
        // Finally, test the interaction endpoint
        const interactionData = JSON.stringify({
          hotelId: '12345',
          action: 'view',
          metadata: {
            viewDuration: 30,
            source: 'search'
          }
        });

        const interactionOptions = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/chat/interactions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(interactionData)
          }
        };

        const interactionReq = http.request(interactionOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log('Interaction response:', data);
          });
        });

        interactionReq.write(interactionData);
        interactionReq.end();
      });
    });

    loginReq.write(loginData);
    loginReq.end();
  });
});

registerReq.write(registerData);
registerReq.end();