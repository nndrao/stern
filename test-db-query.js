// Quick script to check what's in the database
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/configurations/by-user/default-user?componentType=dock',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n=== API Response ===');
    console.log('Status:', res.statusCode);

    try {
      const configs = JSON.parse(data);
      console.log('Configs found:', configs.length);

      if (configs.length > 0) {
        const config = configs[0];
        console.log('\n=== First Config ===');
        console.log('ID:', config.configId);
        console.log('Name:', config.name);
        console.log('Menu Items:', config.config?.menuItems?.length || 0);

        if (config.config?.menuItems) {
          console.log('\n=== Menu Items ===');
          config.config.menuItems.forEach((item, i) => {
            console.log(`${i + 1}. ${item.caption}`);
            if (item.children) {
              item.children.forEach((child, j) => {
                console.log(`   ${i + 1}.${j + 1}. ${child.caption}`);
              });
            }
          });
        }
      } else {
        console.log('No configurations found!');
      }
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();
