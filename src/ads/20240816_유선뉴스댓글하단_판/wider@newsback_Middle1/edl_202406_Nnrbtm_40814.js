  ;(function () {
    var adWidth = 300;
    var adHeight = 250;
    // top level iframe
    try {
      var __parent = parent.parent.document.querySelector('#bottomAdRect');
      if (__parent) {
        __parent.height = adHeight;
        __parent.style.height = adHeight + 'px';
      }   
    } catch(err) {
      window.onload = function() {
        var isNews = location.href.indexOf('news') > -1;
        var isPann = location.href.indexOf('pann') > -1;
        
        if(isNews) {
          window.parent.postMessage({
            "method": "fnct",
            "name": "callCrossOriginAd",
            "property": {target: 'bottomAdRect', height: adHeight}
          }, '*');
        }
        if(isPann) {
          window.parent.postMessage({
            target: 'bottomAdRect',
            params: {
                width: adWidth,
                height: adHeight
            }
          }, '*');
        }
      }
    }
    
    var _parent = parent.document.querySelector('#bottomAdRect');
    if( _parent ) {
      _parent.style.height = '100%';
      var _parentIfr =  parent.document.querySelector('#bottomAdRect iframe');
      if(_parentIfr) {
        _parentIfr.style.width = '100%';
        _parentIfr.style.height = adHeight + 'px';
        _parentIfr.frameBorder = 0;
      }
    }
    var _me = document.querySelector('#bottomAdRect');
    if( _me ) {
      _me.style.width = '100%';
      _me.style.height = '100%';
    }
  
    ;(function(){
      document.write('<script src="https://api.adai.co.kr/cou/api_reco.php?code=natepcnews300x250&adid=&type=js&click_log=&click_type="></script>');
    })()
  })()