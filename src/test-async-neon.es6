const http = require('http')
const debugFn = require('debug')
const debug = debugFn('test')
const task = debugFn('task')

const native = require('../native/index.node')

let taskStarted = false
// create a HTTP server listening on requests and start running task if not running yet
const server = http.createServer((req, res) => {
  debug('handling request')
  if (!taskStarted) {
    taskStarted = true
    task('started')
    native.mine_async((err, n) => { // mine_async takes 10s to finish
      if (err) {
        console.log(err)
      } else {
        task(`result: ${n}`)
      }
      taskStarted = false
      task('ended')
    })
  }
  res.writeHead(200)
  res.end('OK\n')
})
server.listen(1234)

// each second try to GET the server to check it's responsive even when task is running
setInterval(() => {
  debug(`${Date.now()} calling server`)
  let req = http.request({hostname: 'localhost', port: 1234, method: 'GET'}, (res) => {
    res.setEncoding('utf8')
    res.on('data', (chunk) => {
      debug(`body: ${chunk}`)
    })
  })

  req.on('error', (e) => {
    console.error(e)
  })
  req.end()
}, 1000)
