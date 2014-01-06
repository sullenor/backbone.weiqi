var http = require('http');
var scripts = [
    'js.libs/jquery.js',
    'js.libs/underscore.js',
    'js.libs/backbone.js',
    'js/view.canvas.js',
    'js/view.scheme.js'
];

var html = '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>weiqi test page</title><link rel="stylesheet" href="css/scheme.css">';
html += scripts.map(function (s) {
    return '<script type="text/javascript" src="' + s + '"></script>';
});
hmtl += '</head><body><script type="text/javascript" src="client.js"></script></body></html>';

http.createServer(function (req, res) {
    res.setEncoding('utf8');
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}).listen(8080);