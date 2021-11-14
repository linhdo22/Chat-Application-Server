const passport = require('passport')
const LocalStratery = require('passport-local').Strategy
const Users = require('mongoose').model('Users')

passport.use(
	new LocalStratery(
		{ usernameField: 'username', passwordField: 'password' },
		(username, password, done) => {
			Users.findOne({ username: username }, function (err, user) {
				if (err) {
					return done(err)
				}
				if (!user) {
					return done(null, false, { message: 'Incorrect username.' })
				}
				if (!user.validPassword(password)) {
					return done(null, false, { message: 'Incorrect password.' })
				}
				return done(null, user)
			})
		}
	)
)
