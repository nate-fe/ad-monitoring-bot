(function() {
    try{
        var _script = document.createElement('script');
        _script.src = 'https://api.adsrv.co.kr/sa2/kw-req?subId=natepc2news280x280sa&trackingCode=AF0700373';
        
        document.body.appendChild(_script);
        document.body.style.textAlign = 'center';
        var _parent = parent.document.querySelector('#AdIbl');
        if( _parent ) {
            _parent.style.width = '288px'
            _parent.style.height = '288px';
        }
        
    }catch(err){console.warn(err)}  
  })();