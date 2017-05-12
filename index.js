require('app-module-path').addPath(__dirname);

var CONFIG = require('config.json');
var kue = require('kue-scheduler');
var express = require('express');
var basicAuth = require('basic-auth-connect');
var bodyParser = require('body-parser');
var Queue = kue.createQueue({
    redis: CONFIG.redis
});

var app = express();

app.use(basicAuth(CONFIG.user, CONFIG.pass));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/client'));
app.use(kue.app);

require('controllers')(app);
require('tasks')(Queue);

app.listen(CONFIG.port);
console.log('UI started on port:', CONFIG.port);