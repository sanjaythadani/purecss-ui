var fs = require('fs');
var path = require('path');

var express = require('express');
var router = express.Router();

var themes = (fs.readdirSync(path.join(__dirname, '../../css')));
var views = (fs.readdirSync(path.join(__dirname, '../../views')))
    .filter(function(view, i) {
        return view != 'index.html';
    })
    .map(function(view, i) {
        if (view.length && view.length > 5) return {
            page: view.substring(0, view.length - 5)
        };
    });

if (views.length) {
    var themeList = themes
        .map(function(theme, i) {
            return {
                name: theme,
                url: '?theme=' + theme
            };
        });

    views.forEach(function(view, i) {
        if (!view.page) return;

        router.use('/' + (view.page == 'theme' ? '' : view.page), function(req, res, next) {
            var routeData = {};
            var queryParams = req.url.slice(req.url.indexOf('?') + 1).split('&');
            if (Array.isArray(queryParams)) {
                queryParams.forEach(function(value) {
                    var param = value.split('=');
                    routeData[param[0]] = decodeURIComponent(param[1]);
                });
            }

            res.render(
                view.page,
                {
                    currentYear: new Date().getFullYear(),
                    theme: routeData.theme || 'default',
                    themeList: themeList,
                    themeSrc: 'purecss-ui-' + (routeData.theme || 'default') + '.css?v=' + Date.now(),
                    themeQryParam: routeData.theme ? ('?theme=' + routeData.theme) : ''
                },
                function(err, html) {
                    res.send(html);
                }
            );
        });
    });
}

module.exports = router;