(function() {
    try{
        var _iframe = document.createElement('iframe');
        _iframe.src = '//ads-partners.coupang.com/widgets.html?id=799621&trackingCode=AF9846995&subId=natepc2news280x280&width=280&height=280&template=trending-keyword';
        _iframe.width = '248px';
        _iframe.height = '248px';
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('referrerpolicy', 'unsafe-url');
        document.body.style.margin = '0';
        document.body.style.textAlign = 'center';
        document.body.appendChild(_iframe);

        var _parent = parent.document.querySelector('#AdIbl');
        if( _parent ) {
            _parent.style.height = '250px';
        }
        
    }catch(err){console.warn(err)}  
  })();