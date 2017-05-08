var CONFIG = require('./config.json');

var kue = require('kue-scheduler');
var express = require('express');
var basicAuth = require('basic-auth-connect');

var Queue = kue.createQueue({
    restore: true,
    redis: CONFIG.redis
});

Queue.restore(function() {
    require('./tasks')(Queue);
});

var app = express();
app.use(basicAuth(CONFIG.user, CONFIG.pass));
app.use(kue.app);
app.listen(CONFIG.port);
console.log('UI started on port:', CONFIG.port);