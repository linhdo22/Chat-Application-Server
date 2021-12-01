const mongoose = require('mongoose')
const Scheme = mongoose.Schema

const ReminderSchema = new Scheme(
	{
		channel: { type: Scheme.Types.ObjectId, ref: 'Channel' },
		createdBy: { type: Scheme.Types.ObjectId, ref: 'Users' },
		content: { type: String },
		status: { type: String, enum: ['created', 'finished', 'outdated'] },
		due: { type: Date },
	},
	{
		timestamps: true,
	}
)

mongoose.model('Reminder', ReminderSchema)
