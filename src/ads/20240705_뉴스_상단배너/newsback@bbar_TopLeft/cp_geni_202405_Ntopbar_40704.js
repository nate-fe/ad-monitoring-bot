  (function () {
    var ad_height = 120;
    var ad_id = '#adDiv';
    var sub_id = '1268S142180';
    try{
      var ad_frame = parent.document.querySelector(ad_id);
      ad_frame.querySelector('iframe').style.height = ad_height + 'px';
    }catch(err){
      console.log(err);
      window.onload = function() {
        window.top.postMessage({
          "method": "fnct",
          "name": "callCrossOriginAd",
          "property": {target: 'ad02IFrame', height: 120}
        }, '*');
      }
    }
    try{    
      var script = document.createElement('script');
      script.src = '//ads.shople.kr/js/doc_write.js?app_code=BlEZM6mWJQ&cnt=2&type=COUPANG_DNY_1&sub_id='+ sub_id +'&coupang_param=&use_cnt=&tsource=www.nate.com&url_action=&rpum_click=&cp_dny_id=&cp_dny_code=&width=970&height=' + ad_height;
      document.body.appendChild(script);
    }catch(err){}
  })();
  

