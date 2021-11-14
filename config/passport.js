const glob = require('glob')
const passport = require('passport')
const Users = require('mongoose').model('Users')
const path = require('path')

passport.serializeUser(function (user, done) {
	done(null, user.id)
})

passport.deserializeUser(function (id, done) {
	Users.findById(id)
		.select('-password -salt')
		.exec()
		.then((user) => {
			done(null, user)
		})
		.catch((err) => {
			done(err)
		})
})

glob.sync('config/strategies/*.js').forEach((strategypath) => {
	require(path.resolve(strategypath))
})
