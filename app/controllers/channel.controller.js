const mongoose = require('mongoose')
const Channel = mongoose.model('Channel')
const Users = mongoose.model('Users')
const { getObjectId } = require('../../config/helper')
const { updateLastest } = require('../../config/socket-io')

module.exports.createGroup = async (req, res) => {
	let { title, participants } = req.body
	if (!title) {
		res.status(403).jsonp({ error: 'Invalid group name' })
		return
	}
	if (!participants) {
		participants = []
	}
	const newChannel = await new Channel({
		type: 'group',
		title,
		participants: [req.user.id, ...participants],
		messages: [
			{
				type: 'noti',
				time: new Date(),
				content: 'Created new channel',
			},
		],
	}).save()

	await Users.updateMany(
		{ _id: { $in: [req.user.id, ...participants] } },
		{
			$addToSet: { channels: newChannel._id },
		}
	).exec()
	res.jsonp(newChannel)
}

module.exports.getLastestList = async (req, res) => {
	res.jsonp(req.user.channels)
}

module.exports.getMembers = async (req, res) => {
	const { channelId } = req.query
	const channel = await Channel.findById(channelId)
		.populate({
			path: 'participants',
			select: '-password -salt',
		})
		.exec()
	res.jsonp(channel.participants)
}

module.exports.getChannels = async (req, res) => {
	const friendChannels = req.user.friends.map((friend) => {
		return friend.channel
	})
	console.log(friendChannels)
	const result = await Channel.find({
		_id: { $in: [...req.user.channels, ...friendChannels] },
	})
		.slice('messages', 1)
		.lean()
		.exec()
	res.jsonp(result)
}

module.exports.sendMessage = async (req, res) => {
	const { channelId, message } = req.body
	await Channel.updateOne(
		{ _id: getObjectId(channelId) },
		{
			$push: {
				messages: {
					$each: [message],
					$sort: { time: -1 },
				},
			},
		}
	)
	const channel = await Channel.findById(channelId)
		.select('participants')
		.exec()
	updateLastest('message', { channelId }, channel.participants)
	res.end()
}
module.exports.updateMessage = async (req, res) => {
	const { channelId, time } = req.body
	const result = await Channel.findById(channelId)
		.select('messages')
		.slice('messages', 5)
		.exec()
	res.jsonp(result.messages)
}

module.exports.loadHistory = async (req, res) => {
	const { channelId, time } = req.body
	const dtime = new Date(time)
	const result = await Channel.aggregate()
		.match({
			_id: getObjectId(channelId),
		})
		.project({
			messages: {
				$slice: [
					{
						$filter: {
							input: '$messages',
							as: 'message',
							cond: { $lt: ['$$message.time', dtime] },
						},
					},
					10,
				],
			},
		})
		.exec()
	res.jsonp(result[0].messages)
}

module.exports.findChannelById = async (req, res, next, id) => {
	req.channel = await Channel.findById(id).exec()
	next()
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
