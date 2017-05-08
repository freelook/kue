module.exports = function(Queue) {

    var CONFIG = require('../config.json');

    var es = require('event-stream');
    var FeedParser = require('feedparser');
    var request = require('request');
    var safeEval = require('safe-eval');
    var add = require('./add.js')(Queue);

    var rss = {};

    rss.create = function(config) {
        return Queue.createJob('rss', config);
    };

    rss.every = function(time, job) {
        Queue.every(time, job);
    };

    CONFIG.rss.tasks.map(function(item) {
        var rssTask = rss.create(item)
            .priority('normal')
            .unique(item.unique);

        rss.every(item.time, rssTask);
    });

    Queue.process('rss', function(job, done) {
        request(job.data.rss)
            .pipe(new FeedParser())
            .pipe(es.map(function(data, next) {
                add.create({
                        title: safeEval(job.data.add.title, {
                            data: data,
                            require: require
                        }),
                        url: safeEval(job.data.add.url, {
                            data: data,
                            require: require
                        }),
                        date: safeEval(job.data.add.date, {
                            data: data,
                            require: require
                        }),
                        uid: job.data.uid,
                        cid: job.data.cid
                    })
                    .priority('normal')
                    .removeOnComplete(true)
                    .save();
                next();
            })).on('error', function(error) {
                done(error);
            }).on('end', function() {
                done();
            });
    });

    return rss;

};