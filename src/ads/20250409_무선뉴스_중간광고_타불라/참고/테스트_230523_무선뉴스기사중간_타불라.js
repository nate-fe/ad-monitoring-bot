(function() {
    var $ad_view = document.getElementById('ad_innerView');    
    if($ad_view) {    
        var _css = '#ad_innerView{height:auto;margin:0 -20px;}',
        _style = document.createElement('style');
        _style.type = 'text/css';
        _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
        $ad_view.appendChild(_style);
    
        var $head_code = `window._taboola = window._taboola || [];
            _taboola.push({article:'auto'});
            !function (e, f, u, i) {
                if (!document.getElementById(i)){
                e.async = 1;
                e.src = u;
                e.id = i;
                f.parentNode.insertBefore(e, f);
                }
            }(document.createElement('script'),
            document.getElementsByTagName('script')[0],
            '//cdn.taboola.com/libtrc/nate-mobile/loader.js',
            'tb_loader_script');
            if(window.performance && typeof window.performance.mark == 'function')
                {window.performance.mark('tbl_ic');}
    
        `;
    
        var $head_script = document.createElement('script');
        $head_script.type = 'text/javascript';
        $head_script.innerHTML = $head_code;
        document.head.appendChild($head_script);
    
        var _data = $ad_view.querySelector('script');
        var _code = _data.dataset.press_code || '';
    
        var _div = document.createElement('div');
        _div.id = 'taboola-below-article-thumbnails-' + _code;
        _div.onclick = function(e) {
            e.preventDefault();
        }
    
        $ad_view.appendChild(_div);
    
        var $el_code = `
            window._taboola = window._taboola || [];
            _taboola.push({
                mode: 'thumbnails-mid-article',
                container: 'taboola-below-article-thumbnails-${_code}',
                placement: 'Below Article Thumbnails ${_code}',
                target_type: 'mix'
            });
    
        `;
    
        var $body_code = `
            window._taboola = window._taboola || [];
            _taboola.push({flush: true});
    
            _taboola.push({
            listenTo: 'click',
            handler: function(e) {
            if(TRCImpl && TRCImpl.boxes) {
                var trc_impl = TRCImpl.boxes;
                //get first child
                if(trc_impl) {
                var trc_boxes = TRCImpl.boxes[Object.keys(TRCImpl.boxes)[0]];
                if(trc_boxes) {
                    var trc_video = trc_boxes.boxes[0].video_data;
                    if(trc_video && trc_video.logger_url) {
                        window.open(trc_video.logger_url, '_blank', 'noopener,noreferrer');
                    }
                }
                }
            }
            if (e.detail.loggerUrl) {
                window.open(e.detail.loggerUrl, '_blank', 'noopener,noreferrer');
            }
            }
        });
    `;
        var $el_script = document.createElement('script');
        $el_script.type = 'text/javascript';
        $el_script.innerHTML = $el_code;
    
        var $body_script = document.createElement('script');
        $body_script.type = 'text/javascript';
        $body_script.innerHTML = $body_code;
    
        $ad_view.appendChild($el_script);
        document.body.appendChild($body_script);
        }
    })();
    