const mongoose = require('mongoose')

module.exports.getObjectId = (id) => {
	if (!id) {
		return ''
	}

	if (mongoose.Types.ObjectId.isValid(id)) {
		return mongoose.Types.ObjectId(id)
	}
	return ''
}
