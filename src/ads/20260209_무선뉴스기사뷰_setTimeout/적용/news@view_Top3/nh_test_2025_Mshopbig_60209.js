  (function(){
      try {
        parent.document.getElementById('ad_big').height = 252;
        parent.document.getElementById('ad_big').style.height = '252px';
      } catch(e) {
        window.onload = function() {
          window.parent.postMessage({
            "method": "fnct",
            "name": "callCrossOriginAd",
            "property": {target: window.name, height: 250}
          }, '*');
        }
        console.log(window.name)
      }
    var src =
  'https://adad.z00.kr/Reco2/ad.php?pageid=0FlK&bannerid=533Y&campaignid=0RLs&ahxid=recoreco&ahqid=&requid=&adsp=r1&aw=300&ah=250&covd=&actPassback=&blkc=1&tsource=m.news.nate.com&covp=&adsi=i&cage=re&mcid=';

      var el = document.createElement('div');
      el.innerHTML =
          '<div style="text-align:center;width:100%">' +
              '<div style="position:relative;width:300px;height:250px;border:1px solid #ccc;margin:0 auto">' +
                  '<div style="position:absolute;top:0;left:0;background-color:#D5D5D5;color:white;padding:1px;z-index:1">AD</div>' +
                  '<iframe id="ad-0FlK" src="' + src + '" width="300" height="250" frameborder="0" scrolling="no"></iframe>' +
              '</div>' +
          '</div>';

      try {
          var cs = document.currentScript;
          setTimeout(function(){
              if (cs && cs.parentNode) {
                  cs.parentNode.insertBefore(el, cs);
              } else {
                  document.body.appendChild(el);
              }              
          }, 300);
      } catch(e) {
          document.body.appendChild(el);
      }

  })();
