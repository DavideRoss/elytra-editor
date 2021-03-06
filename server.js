var express = require('express');
var argv = require('minimist')(process.argv.slice(2));

console.log('Starting static server...');

var app = express();

app.use(function(req, res, next) {
    res.setHeader('Cache-Control', 'no-transform');
    return next();
});

app.use(express.static('dist'));

var port = argv.port || 1337;
app.listen(port, function() {
    console.log('Server listening on port ' + port);
});
