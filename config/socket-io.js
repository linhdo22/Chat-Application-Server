/* eslint-disable no-console */
const { Server } = require('socket.io')
const http = require('http')
const ChannelController = require('../app/controllers/channel.controller')

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
const checkStatus = (userId) => {
	const users = usersMap.filter((userMap) => userMap.id == userId)
	const user = users[users.length - 1]
	if (!user) {
		return ''
	}
	if (user.busy) {
		return 'busy'
	}
	return user.socket
}
module.exports.checkStatus = checkStatus

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

module.exports.refreshChatHistory = (userIds, channelId) => {
	const stringUserIds = userIds.map((userId) => {
		return userId.toString()
	})
	usersMap.forEach((userMap) => {
		if (stringUserIds.includes(userMap.id)) {
			io.to(userMap.socket).emit('refresh-chat-history', channelId)
		}
	})
}

function defineEvent(socket) {
	socket.on('init-connection', (id) => {
		usersMap.push({ socket: socket.id, id: id })
	})
	// implement private connection
	socket.on(
		'request-private-connection',
		(targetSocketID, requesterObj, type, requestCB) => {
			requesterObj.socket = socket.id
			const targetSocket = io.of('/').sockets.get(targetSocketID)
			// send request to target
			io.to(targetSocketID).emit(
				'request-private-connection',
				requesterObj,
				type
			)
			// handle reponse from target
			targetSocket.once('response-private-connection', (isAccept) => {
				clearTimeout(handleTimeout)
				if (!isAccept) {
					requestCB('reject')
					ChannelController.finishCall(requesterObj, 'missed', type)
					return
				}
				requestCB(`accept`)
			})
			// handle if target timeout
			let handleTimeout = setTimeout(() => {
				targetSocket.removeAllListeners('response-private-connection')
				requestCB('reject')
			}, 6000)
		}
	)
	socket.on(
		'disconnect-private-connection',
		(exchangingTarget, content, type) => {
			socket.to(exchangingTarget.socket).emit('close-private-connection')
			ChannelController.finishCall(exchangingTarget, content, type)
		}
	)
	// webrtc signal
	socket.on('signal-data', (data, targetSocketId) => {
		io.to(targetSocketId).emit('signal-data', data)
	})
}
