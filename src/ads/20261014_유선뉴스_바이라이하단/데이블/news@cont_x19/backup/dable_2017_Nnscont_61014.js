(function () {
    var _div = document.createElement('div');
    var _body = document.body;
    _div.setAttribute('id', 'dablewidget_GlYqmWal');
    _div.setAttribute('data-dable-widget', 'GlYqmWal');
    _body.appendChild(_div);

    var _script = document.createElement('script');
    _script.innerHTML = `
    (function(d,a,b,l,e,r) {
        if(d[b]&&d[b].q)return;d[b]=function()

        {(d[b].q=d[b].q||[]).push(arguments)}
        ;e=a.createElement(l);
        e.async=1;e.charset='utf-8';e.src='//static.dable.io/dist/plugin.min.js';
        r=a.getElementsByTagName(l)[0];r.parentNode.insertBefore(e,r);

        })(window,document,'dable','script');
        dable('setService', 'news.nate.com');
        dable('renderWidget', 'dablewidget_GlYqmWal',

        {ignore_items: true}
        );
    `;
    
    _div.appendChild(_script);
})()