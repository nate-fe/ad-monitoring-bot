(function () {
    try {
      var _el = document.querySelector('#ad_snb');
        
      var _script = document.createElement('script');
      _script.src = 'https://dhx27fjc7b.execute-api.ap-northeast-2.amazonaws.com/dev/coupang/320/80/797988/ad_snb';
      _el.appendChild(_script);
    } catch(e) {
      console.log(e)
    }
  })();