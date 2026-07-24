;(function () {
    var adHeight = 100;
    var ua = navigator.userAgent;
    var _adid = getAgentValue("gadid", ua);
    function getAgentValue(key, u) {
      var su = u.split(";");
      var d;
      for (i=0; i < su.length; i++) {
          d = su[i].split(":");
          if (d[0].toLowerCase() == key) return d[1];
      }
      return "";
    }
      
    if (_adid == "") _adid = "00000000-0000-0000-0000-000000000000";
  
    var _script = document.createElement('script');
    var _div = document.createElement('div');
    var _main_banner = document.getElementById('top_main_banner');
    _script.src = 'https://api.dnxad.com/coupang/coupang_script_v2.php?subId=balsocmgrtb2&layerId=top_main_banner&ifa='+_adid;
    _div.appendChild(_script);
    _main_banner.appendChild(_div);
    console.log(_main_banner)
    _script.async = true;
    _script.onload = function(){
        var _iframe = document.createElement('iframe');
        _iframe.src = 'https://adapi.inlcorp.com/cou/iframe/api_300x250.php?code=adexbalsopb2&adid='+ _adid +'&click_log=1&click_id=&click_type='
        _iframe.width = 300;
        _iframe.height = 250;
        _iframe.frameborder = '0'
        _iframe.scrolling = 'no';
        _iframe.style.border = 'none';
        _main_banner.appendChild(_iframe)
    }
    if (window.parent.document.querySelector('#ad_small > div > iframe')) {
        window.parent.document.querySelector('#ad_small > div > iframe').style.height = '250px';
    }
  })()