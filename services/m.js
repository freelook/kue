module.exports = function(locale) {
    var m = require('moment');
    m.locale(locale || 'en');
    return m;
};