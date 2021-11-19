const mongoose = require('mongoose')
const crypto = require('crypto')
const Scheme = mongoose.Schema

const UserSchema = new Scheme(
	{
		name: { type: String, required: 'Must have a name' },
		age: Number,
		dateOfBirth: { type: Date },
		avatarRef: { type: String },
		gender: { type: String, enum: ['male', 'female'] },
		username: { type: String, unique: true, required: 'Username invalid' },
		password: { type: String },
		salt: { type: String },
		friends: [
			{
				user: { type: Scheme.Types.ObjectId, ref: 'Users' },
				channel: { type: Scheme.Types.ObjectId, ref: 'Channel' },
			},
		],
		channels: [{ type: Scheme.Types.ObjectId, ref: 'Channel' }],
		notification: [
			{
				detail: { type: Scheme.Types.ObjectId, ref: 'Notification' },
				isSeen: Boolean,
			},
		],
	},
	{
		timestamps: true,
	}
)
// hash password when use document.save() , prevent by delete password and salt of saving document
UserSchema.pre('save', function (next) {
	if (this.password && this.password.length > 2) {
		this.salt = Buffer.from(crypto.randomBytes(16).toString('hex'), 'hex')
		this.password = this.hashPassword(this.password)
	}
	return next()
})

UserSchema.methods.hashPassword = function (password) {
	if (this.salt && password) {
		const salt = Buffer.from(this.salt, 'binary')
		const hash = crypto.pbkdf2Sync(password, salt, 10000, 16, 'SHA1')
		const str = hash.toString('hex')
		return str
	} else {
		return password
	}
}
UserSchema.methods.validPassword = function (password) {
	return this.password === this.hashPassword(password)
}
mongoose.model('Users', UserSchema)
