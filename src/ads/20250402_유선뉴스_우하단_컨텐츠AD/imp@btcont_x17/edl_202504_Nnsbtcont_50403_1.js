(function() {
    try{
        var _script = document.createElement('script');
        _script.src = 'https://api.ad4989.or.kr/cou/sa_ad_loader.php?afid=AF0700373&code=natepc2news280x280sa';
        
        document.body.style.margin = '0 0 0 5px';
        document.body.appendChild(_script);
        var _parent = parent.document.querySelector('#AdIbl');
        if( _parent ) {
            _parent.style.height = '280px';
        }
        
    }catch(err){console.warn(err)}  
  })();



  (function() {
    try{
        var _script = document.createElement('script');
        _script.src = 'https://api.ad4989.or.kr/cou/sa_ad_loader.php?afid=AF0700373&code=natepc2news280x280sa';
        
        document.body.appendChild(_script);
        document.body.style.textAlign = 'center';
        var _parent = parent.document.querySelector('#AdIbl');
        if( _parent ) {
            _parent.style.width = '280px'
            _parent.style.height = '260px';
        }
        _script.onload = function() {
            setTimeout(function(){
                var _wrap = document.querySelector('.kw-product-nate');
                var _iframe = document.querySelector('iframe');
                if (_wrap) {
                    _wrap.style.width = '248px';
                }
                if (_iframe) {
                    _iframe.style.width = '248px';
                    _iframe.style.height = '248px';
                }                
            }, 1000);
        }
        
    }catch(err){console.warn(err)}  
  })();