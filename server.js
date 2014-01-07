var http = require('http');
var url = require('url');
var fs = require('fs');

var scripts = [
    'js.libs/jquery.js',
    'js.libs/underscore.js',
    'js.libs/backbone.js',
    'js/view.canvas.js',
    'js/view.scheme.js'
];

var html = '<!doctype html><html lang="en"><head><meta charset="UTF-8" /><title>{{title}}</title>{{head}}</head><body>{{body}}</body></html>';

html = html.replace(/{{([a-z]+)}}/g, function (m, k) {
    switch (k) {
    case 'title':
        return 'weiqi';
    case 'head':
        return '<link rel="stylesheet" href="css/scheme.css" />' + scripts.map(function (s) {
            return '<script type="text/javascript" src="' + s + '"></script>';
        }).join('');
    case 'body':
        return '<script type="text/javascript" src="client.js"></script>';
    }
});



http.createServer(function (req, res) {
    var parsedUrl = url.parse(req.url);
    var path = parsedUrl.pathname;

    if (/^\/[a-z\/\.]+\.[a-z]+$/i.test(path)) {
        fs.readFile('.' + path, function (err, data) {
            if (err) {
                console.log(err.toString());
                res.statusCode = 404;
            } else {
                switch (String(/[a-z]+$/gi.exec(path))) {
                case 'css':
                    res.writeHead(200, {'Content-Type': 'text/css'});
                    break;
                case 'js':
                    res.writeHead(200, {'Content-Type': 'application/javascript'});
                    break;
                }

                res.write(data);
            }

            res.end();
        });
    } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(html);
        res.end();
    }
}).listen(8080);