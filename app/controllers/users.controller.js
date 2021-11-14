const mongoose = require('mongoose')
const Users = mongoose.model('Users')
const passport = require('passport')

module.exports.login = (req, res, next) => {
	passport.authenticate('local', (err, user, info) => {
		if (err || !user) {
			res.status(400).send(info)
		} else {
			if (user) {
				user.password = undefined
				user.salt = undefined
				req.logIn(user, function (err) {
					if (err) {
						res.send(err)
					}
				})
				res.jsonp(req.user)
			} else {
				res.send(info)
			}
		}
	})(req, res, next)
}

module.exports.requiresLogin = (req, res, next) => {
	if (req.isAuthenticated()) {
		next()
	} else {
		res.status(401).send({ error: 'Dont have authorized' })
	}
}
module.exports.logout = (req, res, next) => {
	req.logout()
	res.jsonp(req.user)
}

module.exports.register = async (req, res) => {
	if (!req.body) {
		res.status(403).send('invalid body')
	}
	const user = new Users(req.body)
	await user.save()
	res.json(await Users.findOne({ username: req.body.username }).exec())
}

module.exports.getUserInfo = (req, res, next) => {
	res.jsonp(req.user)
}

module.exports.findUsers = async (req, res) => {
	const { name } = req.body
	if (name == '') {
		res.status(400).send({
			message: 'Invalid name',
		})
	}
	const result = await Users.find({
		name: new RegExp(name, 'i'),
		_id: { $ne: req.user._id },
	})
		.select('-password -salt')
		.exec()
	res.jsonp(result)
}

module.exports.getProfile = (req, res) => {
	res.jsonp(req.userById)
}

module.exports.getUserById = (req, res, next, userId) => {
	Users.findById(userId)
		.select('-password')
		.exec()
		.then((data) => {
			req.userById = data
			next()
		})
		.catch((err) => {
			res.status(400).send(err)
		})
}
