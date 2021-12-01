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
	app.get(
		'/api/channel/get-detail-members',
		Users.requiresLogin,
		Channel.getDetailMembers
	)
	app.get(
		'/api/channel/get-lastest-members',
		Users.requiresLogin,
		Channel.getLastestMembers
	)
	app.post(
		'/api/channel/send-message',
		Users.requiresLogin,
		Channel.sendMessage
	)
	app.post(
		'/api/channel/create-reminder',
		Users.requiresLogin,
		Channel.createReminder
	)
	app.post(
		'/api/channel/check-call-target',
		Users.requiresLogin,
		Channel.checkCallTarget
	)

	app.post(
		'/api/channel/update-message',
		Users.requiresLogin,
		Channel.updateMessage
	)
	app.post('/api/channel/add-members', Users.requiresLogin, Channel.addMembers)
	app.post(
		'/api/channel/remove-members',
		Users.requiresLogin,
		Channel.removeMembers
	)

	app.post(
		'/api/channel/load-history',
		Users.requiresLogin,
		Channel.loadHistory
	)

	app.param('channelId', Users.requiresLogin, Channel.findChannelById)
}
