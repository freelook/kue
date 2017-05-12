module.exports = function(path) {

    var jfs = new(require('jfs'))(['data', path].join('/'), {
        pretty: true
    });

    return jfs;

};