var CONFIG = require('config.json');
var jfs = require('services/jfs.js')(CONFIG.rss.tasks);
var es = require('event-stream');
var FeedParser = require('feedparser');
var request = require('request');
var safeEval = require('safe-eval');

function ModuleRss(Queue) {

    var add = require('tasks/add.js')(Queue);

    var rss = {};

    rss.create = function(config) {
        return Queue.createJob('rss', config);
    };

    rss.every = function(time, job) {
        Queue.every(time, job);
    };

    ModuleRss.tasks(function(err, data) {
        if (!err && data) {
            Object.keys(data).map(function(key) {
                data[key].tasks.map(function(item) {
                    if (item && item.time) {
                        var rssTask = rss.create(item)
                            .priority('normal')
                            .unique(item.unique);

                        rss.every(item.time, rssTask);
                    }
                });
            });
        }
    });

    Queue.process('rss', function(job, done) {
        ModuleRss.parse(job.data.rss)
            .pipe(es.map(function(data, next) {
                add.create(ModuleRss.handler(job.data, data))
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

}

ModuleRss.tasks = function(id, tasks, next) {
    if (id && tasks && next) {
        jfs.save(id, tasks, next);
    }
    else if (id && tasks) {
        next = tasks;
        jfs.get(id, next);
    }
    else if (id) {
        next = id;
        jfs.all(next);
    }
    else {
        return jfs;
    }
};

ModuleRss.parse = function(rss) {
    return request(rss)
        .pipe(new FeedParser());
};

ModuleRss.handler = function(task, data) {
    return {
        title: safeEval(task.add.title, {
            data: data,
            require: require
        }),
        url: safeEval(task.add.url, {
            data: data,
            require: require
        }),
        date: safeEval(task.add.date, {
            data: data,
            require: require
        }),
        uid: task.uid,
        cid: task.cid,
        active: task.add.active
    };
};

module.exports = ModuleRss;