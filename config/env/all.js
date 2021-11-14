module.exports = {
	db: {
		host: process.env.MONGODB_HOST,
		port: process.env.MONGODB_PORT,
		collection: process.env.MONGODB_COLLECTION,
	},
	server: {
		port: process.env.APP_PORT,
	},
}
