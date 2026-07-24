(function () {
    var ad_height = 100;
    var ad_id = '#main_banner';
    var _pub_code = '1001318710';
    var _area_code = '1623639101';
    var _page_url = window.location.href;
    var _direct_url = '';
    var _head = document.querySelector('head')
    var _script = document.createElement('script');
    _script.src = 'https://cdn.nhnace.com/libs/aceat.js?pub_code=' + _pub_code;
    _script.async = 'true';
    _script.type = 'text/javascript';
    _head.appendChild(_script);
    try{
      var ad_frame = parent.document.querySelector(ad_id);
      ad_frame.querySelector('iframe').style.height = ad_height + 'px';
    }catch(err){}
    try{
      var preImg = document.getElementById('preimg')
      var iframe = document.createElement('iframe');
      iframe.width = '100%';
      iframe.height = ad_height;
      iframe.setAttribute('frameborder', 0);
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('marginwidth', 0);
      iframe.setAttribute('marginheight', 0);
      iframe.setAttribute('allowtransparency', true);
      iframe.setAttribute('style', 'margin: 0 auto; overflow: hidden');
      iframe.setAttribute('allow', 'browsing-topics; attribution-reporting');
      iframe.src = 'https://cdn.nhnace.com/libs/aceadlib.html?pub_code=' + _pub_code + '&area_code=' + _area_code +'&pag=PAG&page_url=' + encodeURIComponent(_page_url) + '&direct_url=' + encodeURIComponent(_direct_url);
      preImg.style.display = 'none';
      document.querySelector(ad_id).appendChild(iframe);

    }catch(err){}
  })();

  try {
	top.document.getElementById('ad_big').style.height='100px';
}catch(e){}