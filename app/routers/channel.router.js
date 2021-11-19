const Channel = require('../controllers/channel.controller')
const Users = require('../controllers/users.controller')

module.exports = function (app) {
	app.post('/api/channel/get', Users.requiresLogin, Channel.getChannels)
	app.post('/api/channel/create', Users.requiresLogin, Channel.createGroup)
	app.get(
		'/api/channel/get-lastest-list',
		Users.requiresLogin,
		Channel.getLastestList
	)
	app.post(
		'/api/channel/send-message',
		Users.requiresLogin,
		Channel.sendMessage
	)

	app.post(
		'/api/channel/update-message',
		Users.requiresLogin,
		Channel.updateMessage
	)
	app.post(
		'/api/channel/load-history',
		Users.requiresLogin,
		Channel.loadHistory
	)

	app.param('channelId', Users.requiresLogin, Channel.findChannelById)
}
