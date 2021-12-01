const mongoose = require('mongoose')
const Scheme = mongoose.Schema

const MessageSchema = new mongoose.Schema({
	sendBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'Users' },
	type: { type: String, enum: ['text', 'noti', 'reminder', 'call'] },
	reminder: { type: mongoose.SchemaTypes.ObjectId, ref: 'Reminder' },
	content: String,
	time: Date,
})

mongoose.model('Message', MessageSchema)
const ChannelSchema = new Scheme(
	{
		logoRef: { type: String },
		title: { type: String },
		type: { type: String, enum: ['private', 'group'] },
		messages: [MessageSchema],
		participants: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Users' }],
	},
	{
		timestamps: true,
	}
)
mongoose.model('Channel', ChannelSchema)
