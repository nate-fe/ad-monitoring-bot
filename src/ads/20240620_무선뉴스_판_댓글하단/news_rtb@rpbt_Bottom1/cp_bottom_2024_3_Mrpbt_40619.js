(function () {
    var ad_id = 'news_rtb_rpbt_bottom1';
    var ad_height = 100
    try {
        parent.document.getElementById('main_banner').height = ad_height;
        parent.document.getElementById('main_banner').style.height = ad_height + 'px';
        
        var $div = document.createElement('div');
        $div.setAttribute('style', 'display:block;margin:0 auto;width:320px');
        document.getElementById('main_banner').appendChild($div);

    } catch(e) {
        window.onload = function() {
          window.parent.postMessage({
              target: ad_id,
              params: {
                height: ad_height
              }
            }, '*');
        }
    }
    try{
        var iframe = document.createElement('iframe');
        iframe.width = 320;
        iframe.height = 100;
        iframe.setAttribute('frameborder', 0);
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('marginwidth', 0);
        iframe.setAttribute('marginheight', 0);
        iframe.setAttribute('vspace', 0);
        iframe.setAttribute('hspace', 0);
        iframe.setAttribute('allowtransparency', true);
        iframe.src='https://api.adreload.com/cou/iframe/api_320x100.php?code=admdkeyboarddw1&adid=576d266f-1525-4d07-a075-bee48fd6a03e&click_log=1&click_id=&click_type=2';  
        document.querySelector('#main_banner').appendChild(iframe);
  }catch(e){}
})();