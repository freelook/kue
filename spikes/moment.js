var PATH = '.';
var text = '25 июня 2017 в 9:22';


function f(locale) {
    return require.main.require(PATH + './services/m.js')(locale)(text, 'DD MMMM YYYY в HH:mm').format();
}

function s(locale) {
    return require.main.require(PATH + './services/m.js')(locale)().subtract(1, 'days').format();
}

console.log('Format: ', f('ru'));
console.log('Subtract: ', s('ru'));