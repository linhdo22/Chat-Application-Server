const mongoose = require('mongoose')
const Scheme = mongoose.Schema

const ChannelSchema = new Scheme(
	{
		title: { type: String },
		type: { type: String, enum: ['private', 'group'] },
		messages: [
			{
				sendBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'Users' },
				content: String,
				time: Date,
			},
		],
		participants: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Users' }],
	},
	{
		timestamps: true,
	}
)
mongoose.model('Channel', ChannelSchema)
