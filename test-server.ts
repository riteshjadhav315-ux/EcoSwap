import http from 'http';
const server = http.createServer((req, res) => {
  res.end('Hello World');
});
server.listen(3000, '0.0.0.0', () => {
  console.log('Test server listening on 3000');
});
