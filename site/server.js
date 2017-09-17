let connect = require('connect');
let serveStatic = require('serve-static');
let port = 3001

connect().use(serveStatic(__dirname)).use(serveStatic('../')).listen(port, run)

function run() {
  console.log('server running on port ' + port)
}