const Users = require('../controllers/users.controller')

module.exports = function (app) {
	// api
	app.post('/login', Users.login)
	app.get('/logout', Users.logout)
	app.post('/user/register', Users.register)
	app.get('/api/user/get-user-info', Users.requiresLogin, Users.getUserInfo)
	app.post(
		'/api/user/update-user-info',
		Users.requiresLogin,
		Users.updateUserInfo
	)
	app.get('/api/user-profile/:userId', Users.getProfile)
	app.post(
		'/api/user/response-friend',
		Users.requiresLogin,
		Users.responseFriendRequest
	)
	app.get('/api/user/notification', Users.requiresLogin, Users.getNotification)
	app.post('/api/user/remove-friend', Users.requiresLogin, Users.removeFriend)
	app
		.route('/api/user/request-friend')
		.post(Users.requiresLogin, Users.requestFriend)
	app.route('/api/user/find-users').post(Users.requiresLogin, Users.findUsers)
	app.route('/api/user/get-friends').post(Users.requiresLogin, Users.getFriends)
	app.param('userId', Users.getUserById)
}
