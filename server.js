/* eslint-disable no-console */
require('dotenv').config()

function loadExpress() {
	const express = require('./config/express')
	express()
}

function loadPassport() {
	require('./config/passport')
}

function connectDatabase() {
	const mongodb = require('./config/mongodb')
	mongodb()
}
function main() {
	connectDatabase()
	loadExpress()
	loadPassport()
}
main()
