module.exports = function(Queue) {

    Queue.clear(function() {
        require('./rss.js')(Queue);
    });

};