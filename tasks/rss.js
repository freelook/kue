var CONFIG = require('config.json');
var jfs = require('services/jfs.js')(CONFIG.rss.tasks);
var es = require('event-stream');
var FeedParser = require('feedparser');
var request = require('request');
var safeEval = require('safe-eval');
var scrapeIt = require('scrape-it');
var async = require('async');

var CONCURRENT_JOBS = 3;

function ModuleRss(Queue) {

    var add = require('tasks/add.js')(Queue);

    var rss = {};

    rss.create = function(config) {
        return Queue.createJob('rss', config);
    };

    rss.createAdd = function(item) {
        return add.create(item)
            .priority('normal')
            .removeOnComplete(true)
            .save();
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

    Queue.process('rss', CONCURRENT_JOBS, function(job, done) {
        if (job.data.html && job.data.items) {
            async.waterfall([
                function(next) {
                    ModuleRss.scrape(job.data, next);
                },
                function(res, next) {
                    if (res && res.items) {
                        try {
                            res.items.map(function(data) {
                                rss.createAdd(ModuleRss.handler(job.data, data));
                            });
                            next();
                        }
                        catch (err) {
                            next(new Error(err));
                        }
                    }
                    else {
                        next(new Error('No items found.'));
                    }
                }
            ], function() {
                done();
            });
        }
        else if (job.data.rss) {
            ModuleRss.parse(job.data.rss)
                .pipe(es.map(function(data, next) {
                    rss.createAdd(ModuleRss.handler(job.data, data));
                    next();
                })).on('error', function(err) {
                    done(new Error(err));
                }).on('end', function() {
                    done();
                });
        }
        else {
            done();
        }
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

ModuleRss.scrape = function(data, next) {
    scrapeIt(data.html, {
        items: data.items
    }, function(err, res) {
        next(err, res);
    });
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
        date: !!task.add.date ? safeEval(task.add.date, {
            data: data,
            require: require
        }) : '',
        tags: !!task.add.tags ? safeEval(task.add.tags, {
            data: data,
            require: require
        }) : [],
        uid: task.uid,
        cid: task.cid,
        active: task.add.active
    };
};

module.exports = ModuleRss;