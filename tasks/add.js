var CONFIG = require('config.json');
var request = require('request');

function ModuleAdd(Queue) {

    var add = {};

    add.create = function(config) {
        return Queue.create('add', config);
    };

    add.schedule = function(time, job) {
        Queue.schedule(time, job);
    };

    Queue.process('add', function(job, done) {

        var link = job.data.url;
        var searchUrl = [CONFIG.add.host, 'api/search?term=', '"', link, '"'].join('');

        request
            .get(searchUrl, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    try {
                        var jsonBody = JSON.parse(body);
                        if (jsonBody && jsonBody.posts && !jsonBody.posts.length) {
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
                tags: data.tags,
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