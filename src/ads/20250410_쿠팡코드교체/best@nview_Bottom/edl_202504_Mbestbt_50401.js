(function() {
    try{
        var mainBanner = document.querySelector('#main_banner');
        var _script = document.createElement('script');
        _script.src = 'https://api.adsrv.co.kr/sa2/kw-req?subId=natem320x200&trackingCode=AF0700373';
        
        mainBanner.appendChild(_script);
        
    }catch(err){console.warn(err)}  
  })();