const mongoose = require('mongoose')
const Scheme = mongoose.Schema

const NotificationSchema = new Scheme(
	{
		type: { type: String, enum: ['request-friend'] },
		sendBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'Users' },
		time: { type: Date },
	},
	{
		timestamps: true,
	}
)

mongoose.model('Notification', NotificationSchema)
