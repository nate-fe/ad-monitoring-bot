(function() {
    try{
        var ifrMainBanner = document.querySelector('#ifr_main_banner');
        var _script = document.createElement('script');
        _script.src = 'https://api.adsrv.co.kr/sa2/kw-req?subId=natem300x250&trackingCode=AF0700373';
        ifrMainBanner.appendChild(_script);
        
        var _parent = parent.document.querySelector('iframe');
        var _parentOfParent = parent.parent.document.querySelector('#ifr_ad_shopbox');
        if( _parent ) {
            _parent.style.width = '300px';
            _parent.style.height = '250px';
        }
        if ( _parentOfParent ) {
            _parentOfParent.style.width = '300px';
            _parentOfParent.style.height = '250px';
        }
        
    } catch(err) {console.log(err)}
  })()