(function () {
    try {      
      var $css = '#ad_big > div {margin: 0 auto;}';
      var $style = document.createElement('style'); 
      $style.type = 'text/css';
      $style.styleSheet ? $style.styleSheet.cssText = $css : $style.appendChild(document.createTextNode($css));
      var pass_url = !!ad_type && ad_type === 'app' ? 'appmain@nb_Top3?exception_ads=229644' : 'main@nb_Top3?exception_ads=229644';
      var dnxad_divs = document.querySelectorAll('#ad_big');
      dnxad_divs.forEach(v => {
        var ad_script = document.createElement('script');
        ad_script.src = '//api.dnxad.com/coupang/script_320x150_v1.php?subId=natethree&layerId=ad_big';
        ad_script.onerror = function() {
          var replace_script = document.createElement('script');
          replace_script.src = '//cyad1.nate.com/js.kti/mnate/' + pass_url;
          v.appendChild(replace_script);
          throw new Error('network ad error');
        }
          
        document.head.appendChild($style);
        v.appendChild(ad_script);
      });
    }catch(err){console.warn(err);}
  })();
  