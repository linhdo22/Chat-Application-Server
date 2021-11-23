/* eslint-disable no-console */
const { Server } = require('socket.io')
const http = require('http')

let io
const usersMap = [] // { socket, id }

module.exports = {
	initServer: function ({ app, port }) {
		const server = http.createServer(app)
		io = new Server(server)
		io.on('connection', (socket) => {
			defineEvent(socket)
		})
		server.listen(port, () => {
			console.log(`Example app listening at http://localhost:${port}`)
		})
	},
}
module.exports.updateLastest = (type, options, userIds) => {
	let command = `have-new-${type}`
	const stringUserIds = userIds.map((userId) => {
		return userId.toString()
	})
	usersMap.forEach((userMap) => {
		if (stringUserIds.includes(userMap.id)) {
			io.to(userMap.socket).emit(command, options)
		}
	})
}

function defineEvent(socket) {
	socket.on('init-connection', (id) => {
		usersMap.push({ socket: socket.id, id: id })
	})
}
