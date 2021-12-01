const mongoose = require('mongoose')
const Channel = mongoose.model('Channel')
const Users = mongoose.model('Users')
const Reminder = mongoose.model('Reminder')
const { getObjectId } = require('../../config/helper')
const {
	updateLastest,
	checkStatus,
	requestWebRTC,
} = require('../../config/socket-io')

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

module.exports.getLastestMembers = async (req, res) => {
	const { channelId } = req.query
	const channel = await Channel.findById(channelId)
		.select('participants')
		.exec()
	res.jsonp(channel.participants)
}
module.exports.getDetailMembers = async (req, res) => {
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
	const result = await Channel.find({
		_id: { $in: [...req.user.channels, ...friendChannels] },
	})
		.slice('messages', 1)
		.populate('messages.reminder')
		.lean()
		.exec()
	res.jsonp(result)
}

module.exports.addMembers = async (req, res) => {
	const { targets, channelId } = req.body
	const idList = targets.map((target) => getObjectId(target._id))
	const updateUser = Users.updateMany(
		{ _id: { $in: idList } },
		{
			$addToSet: { channels: getObjectId(channelId) },
		}
	)
	const newMessages = targets.map((target) => {
		return {
			type: 'noti',
			time: new Date(),
			content: `${req.user.name} has added ${target.name}`,
		}
	})
	console.log(newMessages)
	const updateChannel = Channel.findOneAndUpdate(
		{ _id: channelId },
		{
			$addToSet: { participants: { $each: idList } },
			$push: {
				messages: { $each: newMessages, $position: 0 },
			},
		}
	)
	const result = await Promise.all([await updateUser, await updateChannel])
	updateLastest('members', { channelId }, result[1].participants)
	updateLastest('messages', { channelId }, result[1].participants)
	res.end()
}

module.exports.removeMembers = async (req, res) => {
	const { targets, channelId } = req.body
	const idList = targets.map((target) => getObjectId(target._id))

	const updateUser = await Users.updateMany(
		{ _id: { $in: idList } },
		{
			$pull: { channels: getObjectId(channelId) },
		}
	)
	const newMessages = targets.map((target) => {
		return {
			type: 'noti',
			time: new Date(),
			content: `${req.user.name} has removed ${target.name}`,
		}
	})
	const updateChannel = await Channel.findOneAndUpdate(
		{ _id: channelId },
		{
			$pull: { participants: { $in: idList } },
			$push: {
				messages: { $each: newMessages, $position: 0 },
			},
		}
	)
	updateLastest('members', { channelId }, updateChannel.participants)
	updateLastest('messages', { channelId }, updateChannel.participants)
	res.end()
}

module.exports.sendMessage = async (req, res) => {
	const { channelId, message } = req.body
	const channel = await Channel.findOneAndUpdate(
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
	updateLastest('messages', { channelId }, channel.participants)
	res.end()
}

module.exports.createReminder = async (req, res) => {
	const { channelId, due, content } = req.body
	const reminder = await new Reminder({
		channel: getObjectId(channelId),
		createdBy: req.user._id,
		content,
		status: 'created',
		due: new Date(due),
	}).save()

	const message = {
		sendBy: req.user._id,
		type: 'reminder',
		reminder: reminder._id,
		content: 'Lời nhắc',
		time: new Date(),
	}
	const channel = await Channel.findOneAndUpdate(
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
	updateLastest('messages', { channelId }, channel.participants)
	res.end()
}
module.exports.updateMessage = async (req, res) => {
	const { channelId, time } = req.body
	const result = await Channel.findById(channelId)
		.select('messages')
		.slice('messages', 5)
		.exec()
	const final = await Channel.populate(result, { path: 'messages.reminder' })
	res.jsonp(final.messages)
}

module.exports.checkCallTarget = async (req, res) => {
	const { channelId, targetId, type } = req.body
	const socketId = checkStatus(targetId)
	if (!socketId || socketId == 'busy') {
		await Channel.updateOne(
			{ _id: getObjectId(channelId) },
			{
				$push: {
					messages: {
						$each: [
							{
								type: type,
								time: new Date(),
								content: 'missed',
								sendBy: req.user._id,
							},
						],
						$position: 0,
					},
				},
			}
		)
		updateLastest('messages', { channelId }, [req.user._id, targetId])
		res.jsonp({ error: socketId ? 'busy' : 'offline' })
		return
	}
	const target = await Users.findById(targetId).select('name').lean().exec()
	target.socket = socketId
	target.channelId = channelId
	target.startUser = req.user._id.toString()
	res.jsonp({
		success: 'success',
		target,
	})
}

module.exports.loadHistory = async (req, res) => {
	const { channelId, time } = req.body
	const dtime = new Date(time)
	const result = await Channel.aggregate([
		{
			$match: { _id: getObjectId(channelId) },
		},
		{
			$project: {
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
			},
		},
		{
			$unwind: {
				path: '$messages',
			},
		},
		{
			$lookup: {
				from: 'reminders',
				localField: 'messages.reminder',
				foreignField: '_id',
				as: 'messages.reminder',
			},
		},
		{
			$unwind: {
				path: '$messages.reminder',
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$group: {
				_id: '$_id',
				messages: { $push: '$messages' },
			},
		},
	]).exec()
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

module.exports.finishCall = async (exchangingTarget, content, type) => {
	const channel = await Channel.findOneAndUpdate(
		{ _id: getObjectId(exchangingTarget.channelId) },
		{
			$push: {
				messages: {
					$each: [
						{
							type: type,
							time: new Date(),
							content: content,
							sendBy: getObjectId(exchangingTarget.startUser),
						},
					],
					$position: 0,
				},
			},
		}
	)
	updateLastest('messages', { channelId: channel._id }, [
		...channel.participants,
	])
}
