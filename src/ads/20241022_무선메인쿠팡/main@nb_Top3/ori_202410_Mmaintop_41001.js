(function () {
    try {
      var pass_url = !!ad_type && ad_type === 'app' ? 'appmain@nb_Top3?exception_ads=231392' : 'main@nb_Top3?exception_ads=231392';
      var ad_container = document.querySelectorAll('#ad_big');
      ad_container.forEach(v => {
        var ad_script = document.createElement('script');
        ad_script.src = '//api.dnxad.com/coupang/coupang_script_v1.php?subId=natethree&layerId=ad_big';
        ad_script.onerror = function() {
          var replace_script = document.createElement('script');
          replace_script.src = '//cyad1.nate.com/js.kti/mnate/' + pass_url;
          v.appendChild(replace_script);
          throw new Error('network ad error');
        }
        ad_script.onload = function() {
          v.style.maxHeight = '150px';
        }
        v.appendChild(ad_script);
      });
    }catch(err){console.warn(err);}
  })();