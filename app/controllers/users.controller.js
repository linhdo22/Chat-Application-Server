const mongoose = require('mongoose')
const Users = mongoose.model('Users')
const Channel = mongoose.model('Channel')
const Notification = mongoose.model('Notification')
const passport = require('passport')
const helper = require('../../config/helper')

const { updateLastest } = require('../../config/socket-io')

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
	try {
		const user = new Users(req.body)
		await user.save()
		res.json(await Users.findOne({ username: req.body.username }).exec())
	} catch (error) {
		res.status(403).jsonp(error)
	}
}

module.exports.getUserInfo = (req, res, next) => {
	res.jsonp(req.user)
}
module.exports.updateUserInfo = async (req, res, next) => {
	const result = await Users.findOneAndUpdate({ _id: req.user._id }, req.body, {
		new: true,
	})
		.select('-password -salt')
		.exec()
	res.jsonp(result)
}

module.exports.findUsers = async (req, res) => {
	const { name } = req.body
	if (name == '') {
		res.status(400).send({
			message: 'Invalid name',
		})
	}
	const listFriend = req.user.friends.map((friendMap) => {
		return friendMap.user
	})
	const result = await Users.find({
		name: new RegExp(name, 'i'),
		_id: { $nin: [req.user._id, ...listFriend] },
	})
		.select('-password -salt')
		.exec()
	res.jsonp(result)
}

module.exports.removeFriend = async (req, res) => {
	const { friendId, channelId } = req.body
	if (friendId == '') {
		res.status(400).send({
			message: 'Invalid id',
		})
	}
	const removeFromUser = await Users.updateMany(
		{
			_id: { $in: [req.user._id, friendId] },
		},
		{
			$pull: {
				friends: { user: { $in: [req.user._id, friendId] } },
			},
		}
	).exec()
	res.jsonp(removeFromUser)
	updateLastest('friends', {}, [req.user._id, friendId])
	updateLastest('channels', {}, [req.user._id, friendId])
}

module.exports.requestFriend = async (req, res) => {
	const { userId } = req.body
	const noti = await Notification.findOneAndUpdate(
		{
			sendBy: req.user.id,
			type: 'request-friend',
		},
		{
			sendBy: req.user.id,
			type: 'request-friend',
			time: Date.now(),
		},
		{ upsert: true, new: true }
	).exec()

	const result = await Users.bulkWrite([
		{
			updateOne: {
				filter: {
					_id: helper.getObjectId(userId),
					'notification.detail': { $ne: noti._id },
				},
				update: {
					$push: { notification: { detail: noti._id, isSeen: false } },
				},
			},
		},
		{
			updateOne: {
				filter: { _id: helper.getObjectId(userId) },
				update: {
					$set: {
						'notification.$[element]': {
							detail: noti._id,
							isSeen: false,
						},
					},
				},
				arrayFilters: [
					{
						'element.detail': noti._id,
					},
				],
			},
		},
	])
	updateLastest('notification', {}, [userId])
	res.jsonp(result)
}

module.exports.getNotification = async (req, res) => {
	const notifications = await Users.findById(req.user._id)
		.select('notification')
		.populate({
			path: 'notification.detail',
			populate: {
				path: 'sendBy',
				select: 'name',
			},
		})
		.exec()
	res.jsonp(notifications.notification)
}

module.exports.responseFriendRequest = async (req, res) => {
	const { action, request } = req.body
	const sendBy = helper.getObjectId(request.detail.sendBy._id)
	if (action == 'accept') {
		const privateChannel = await Channel.findOneAndUpdate(
			{
				type: 'private',
				participants: {
					$all: [
						{ $elemMatch: { $eq: req.user._id } },
						{ $elemMatch: { $eq: sendBy } },
					],
				},
			},
			{
				type: 'private',
				participants: [req.user._id, sendBy],
				$push: {
					messages: {
						type: 'noti',
						time: new Date(),
						content: 'You guys become friends',
					},
				},
			},
			{
				new: true,
				upsert: true,
			}
		).exec()
		console.log(privateChannel)
		await Users.bulkWrite([
			{
				updateOne: {
					filter: {
						_id: req.user._id,
					},
					update: {
						$addToSet: {
							friends: { user: sendBy, channel: privateChannel._id },
						},
					},
				},
			},
			{
				updateOne: {
					filter: {
						_id: sendBy,
					},
					update: {
						$addToSet: {
							friends: { user: req.user._id, channel: privateChannel._id },
						},
					},
				},
			},
		])
	}

	const removeFromUser = Users.updateOne(
		{ _id: req.user._id },
		{
			$pull: {
				notification: { _id: helper.getObjectId(request._id) },
			},
		}
	).exec()
	const removeFromNotification = Notification.deleteOne({
		_id: helper.getObjectId(request.detail._id),
	}).exec()
	Promise.all([await removeFromUser, await removeFromNotification]).then(
		(result) => {
			res.jsonp(result)
			updateLastest('friends', {}, [req.user._id, sendBy])
			updateLastest('notification', {}, [req.user._id])
		}
	)
}

module.exports.getFriends = async (req, res) => {
	const result = await Users.findById(req.user._id)
		.select('friends')
		.populate({ path: 'friends.user', select: '-password -salt' })
		.lean()
		.exec()
	res.jsonp(result.friends)
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
