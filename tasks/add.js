var CONFIG = require('config.json');
var request = require('request');
var url = require('url');

function ModuleAdd(Queue) {

    var add = {};

    add.create = function(config) {
        return Queue.create('add', config);
    };

    add.schedule = function(time, job) {
        Queue.schedule(time, job);
    };

    Queue.process('add', function(job, done) {

        var link = url.parse(job.data.url);
        var searchTerm = (link.pathname.length < 10) ? link.host + link.pathname : link.pathname;
        var searchUrl = [CONFIG.add.host, 'api/search?term=', searchTerm].join('');

        request
            .get(searchUrl, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    try {
                        var jsonBody = JSON.parse(body);
                        if (jsonBody && jsonBody.posts && !jsonBody.posts.some(function(item) {
                                return !!~item.content.indexOf(searchTerm);
                            })) {
                            ModuleAdd.write(job.data, done);
                        }
                        else {
                            done();
                        }
                    }
                    catch (e) {
                        done(e);
                    }
                }
                else {
                    done(err);
                }
            })
            .on('error', function(error) {
                done(error);
            });

    });

    return add;

}

ModuleAdd.write = function(data, done) {
    if (data.active) {
        request.post({
            url: [CONFIG.add.host, 'api/v1', '/topics'].join(''),
            auth: {
                bearer: CONFIG.add.token
            },
            json: {
                _uid: data.uid,
                cid: data.cid,
                title: data.title,
                content: data.url,
                timestamp: Date.parse(data.date)
            }
        }, function(err, response, body) {
            done(err);
        });
    }
    else {
        done();
    }
};

module.exports = ModuleAdd;