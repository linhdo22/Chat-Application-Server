const Users = require('../controllers/users.controller')

module.exports = function (app) {
	// api
	app.post('/login', Users.login)
	app.get('/logout', Users.logout)
	app.post('/user/register', Users.register)
	app.get('/api/user/get-user-info', Users.requiresLogin, Users.getUserInfo)
	app.get('/api/user-profile/:userId', Users.getProfile)

	app.route('/api/user/find-users').post(Users.requiresLogin, Users.findUsers)
	app.param('userId', Users.getUserById)
}
