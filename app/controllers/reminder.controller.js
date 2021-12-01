const mongoose = require('mongoose')
const Reminder = mongoose.model('Reminder')
const { getObjectId } = require('../../config/helper')
const {
	updateLastest,
	checkStatus,
	refreshChatHistory,
} = require('../../config/socket-io')

module.exports.getDetailReminder = async (req, res) => {
	res.jsonp(req.reminder)
}
module.exports.updateReminder = async (req, res) => {
	const { _id: id, content, due, status, channel } = req.body
	const reminder = await Reminder.findOneAndUpdate(
		{ _id: id },
		{
			content,
			due,
			status,
		}
	)
	refreshChatHistory(channel.participants, channel._id)
	res.jsonp(reminder)
}
module.exports.getListReminderChannel = async (req, res) => {
	const { channelId } = req.body
	const list = await Reminder.find({
		channel: getObjectId(channelId),
	})
		.populate({ path: 'channel', select: '-messages' })
		.populate({ path: 'createdBy', select: 'name' })
		.sort('due')
		.lean()
		.exec()
	res.jsonp(list)
}

module.exports.findReminderById = async (req, res, next, id) => {
	req.reminder = await Reminder.findById(id)
		.populate({ path: 'channel', select: '-messages' })
		.populate({ path: 'createdBy', select: 'name' })
	next()
}
