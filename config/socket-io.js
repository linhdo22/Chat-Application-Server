/* eslint-disable no-console */
const { Server } = require('socket.io')
const http = require('http')

let io

module.exports = {
	initServer: function ({ app, port }) {
		const server = http.createServer(app)
		io = new Server(server)
		io.on('connection', () => {})
		server.listen(port, () => {
			console.log(`Example app listening at http://localhost:${port}`)
		})
	},
}
