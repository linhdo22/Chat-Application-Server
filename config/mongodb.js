/* eslint-disable no-console */

const mongoose = require('mongoose')
const chalk = require('chalk')
const config = require('./config')

module.exports = function () {
	mongoose.set('useCreateIndex', true)
	mongoose.set('useFindAndModify', false)
	mongoose
		// .connect(
		// 	`mongodb://${config.db.host}:${config.db.port}/${config.db.collection}`,
		// 	{ useNewUrlParser: true, useUnifiedTopology: true }
		// )
		.connect(
			'mongodb+srv://zulu:4sKv3ejLzLEcMSPA@cluster0.39kmy.mongodb.net/zulu?retryWrites=true&w=majority',
			{ useNewUrlParser: true, useUnifiedTopology: true }
		)
		.then(() => {
			console.log(chalk.green('Connected ') + 'to database')
		})
		.catch((error) => {
			console.log(chalk.red(error))
		})
}
