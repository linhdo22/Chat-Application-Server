const express = require('express')
const morgan = require('morgan')
const glob = require('glob')
const config = require('./config')
const session = require('express-session')
const mongoStore = require('connect-mongo')
const passport = require('passport')
const path = require('path')
const app = express()

const SocketIO = require('./socket-io')
const port = config.server.port || 3000

module.exports = function () {
	// import models
	// const modelpaths = glob.sync('app/models/**/*.model.js')
	const modelpaths = glob.sync('app/models/**/*.model.js')
	modelpaths.forEach((modelpath) => require(path.resolve(modelpath)))

	//CORS
	app.use(function (req, res, next) {
		res.header('Access-Control-Allow-Origin', req.headers.origin)
		res.header('Access-Control-Allow-Credentials', true)
		res.header(
			'Access-Control-Allow-Headers',
			'Origin, X-Requested-With, Content-Type, Accept'
		)
		next()
	})

	// set public file like libraries and bundle
	app.use(express.static(path.join(__dirname, '../public')))

	//	morgan logger
	app.use(morgan('dev'))

	// parse request
	app.use(express.json())

	// create session storage
	const sessionStore = mongoStore.create({
		mongoUrl: `mongodb://${config.db.host}:${config.db.port}/${config.db.collection}`,
		ttl:3600 // 1 hour
	})

	// config session
	app.use(
		session({
			secret: 'secret',
			resave: false,
			saveUninitialized: false,
			store: sessionStore,
			cookie: { maxAge: 1000 * 3600 * 24 * 31 },
		})
	)

	// config passport
	app.use(passport.initialize())
	app.use(passport.session())

	// import routers
	const routerpaths = glob.sync('./app/routers/**/*.router.js')
	routerpaths.forEach((path) => require('../' + path)(app))

	SocketIO.initServer({ app, port })
}
