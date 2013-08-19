#!/usr/bin/env node

var util = require('util');
var express = require('express');
var http = require('http')
var path = require('path');
var httpauth = require('express-http-auth').realm('');

var agresso = require('./agresso');

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('evi123456789987654321'));
	app.use(express.session());
	app.use(app.router);
	app.use(require('stylus').middleware(__dirname + '/public'));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

app.get('/', httpauth, function(req, res) {
	// res.render('index', { title: 'Hello World' });

	agresso.getVerlof(req.username, req.password, function (err, verlof){
		if(err) return sendError(err, res);

		res.json(verlof);
	});

	// req.send(103);
});

/**
 * Handig om meteen errors naar de client te sturen en ook te loggen
 */
function sendError(err, webresponse){
	var o = {
		err: err.toString()
	};
	console.log(err);

	if(err.stack){
		console.log(err.stack);
		o.errstack = err.stack;
	}

	webresponse.json(o);
}
