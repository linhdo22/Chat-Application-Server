const Reminder = require('../controllers/reminder.controller')
const Users = require('../controllers/users.controller')

module.exports = function (app) {
	app.get(
		'/api/reminder/:reminderId',
		Users.requiresLogin,
		Reminder.getDetailReminder
	)
	app.post('/api/reminder/update', Users.requiresLogin, Reminder.updateReminder)
	app.post(
		'/api/reminder/get-list-channel',
		Users.requiresLogin,
		Reminder.getListReminderChannel
	)
	app.param('reminderId', Reminder.findReminderById)
}
