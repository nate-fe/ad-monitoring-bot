(function() {
    try{
        var _iframe = document.createElement('iframe');
        _iframe.src = '//ads-partners.coupang.com/widgets.html?id=755773&trackingCode=AF0700373&subId=natepcnews280x280&width=280&height=280&template=trending-keyword';
        _iframe.width = 250;
        _iframe.height = 250;
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('referrerpolicy', 'unsafe-url');
        document.body.appendChild(_iframe);

        var _parent = parent.document.querySelector('#AdIbl');
        if( _parent ) {
            _parent.style.height = '250px';
        }
        
    }catch(err){console.warn(err)}  
  })();

  // 참고 : news_na_202403_Nnsbtcont_40311