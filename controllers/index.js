module.exports = function(app) {

    var CONFIG = require('config.json');
    var rss = require('tasks/rss.js');
    var route = '/' + CONFIG.rss.tasks;
    var es = require('event-stream');

    function sendError(res, err) {
        res.status(404).json({
            err: err
        });
    }

    app.get('/admin', function(req, res) {
        res.redirect('/json.html');
    });

    app.post('/reload', function(req, res) {
        process.exit(1);
    });

    app.get(route, function(req, res) {
        rss.tasks(function(err, data) {
            if (!err && data) {
                return res.json(Object.keys(data));
            }
            sendError(res, err);
        });
    });

    app.put(route, function(req, res) {
        rss.tasks(function(err, data) {
            if (!err && data) {
                var keys = Object.keys(data);
                req.body.filter(function(item) {
                        var index = keys.indexOf(item);
                        keys.splice(index, 1);
                        return !~index;
                    })
                    .map(function(item) {
                        rss.tasks(item, {
                            id: item,
                            tasks: []
                        }, function() {});
                    });
                keys.map(function(item) {
                    rss.tasks().delete(item, function() {});
                });
                return res.status(200).json({
                    data: req.body
                });
            }
            sendError(res, err);
        });
    });

    app.get([route, 'test', ':id', ':unique'].join('/'), function(req, res) {
        rss.tasks(req.params.id, function(err, data) {
            if (!err && data) {
                var task = data.tasks.find(function(item) {
                    return item.unique === req.params.unique;
                });
                return rss.parse(task.rss)
                    .pipe(es.map(function(config) {
                        res.json(rss.handler(task, config));
                    }))
                    .on('error', function() {});
            }
            sendError(res, err);
        });
    });

    app.get([route, ':id'].join('/'), function(req, res) {
        rss.tasks(req.params.id, function(err, data) {
            if (!err && data) {
                return res.json(data);
            }
            sendError(res, err);
        });
    });

    app.put([route, ':id'].join('/'), function(req, res) {
        rss.tasks(req.params.id, req.body, function(err) {
            if (!err) {
                return res.status(200).json({
                    data: req.body
                });
            }
            sendError(res, err);
        });
    });

};
