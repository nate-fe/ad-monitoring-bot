(function () {
    try {
      var _script = document.currentScript;
      var _adArea = _script && _script.parentNode;
      if (!_adArea || _adArea === document.head) return;
      
      _adArea.style.height = '250px';
  
      var _box = document.createElement('div');
      _box.style.textAlign = 'center';
      _adArea.appendChild(_box);
  
      var _s1 = document.createElement('script');
      _s1.src = 'https://api.ootoo.co.kr/cou/api_reco.php?code=csamff300250nat8182m&adid=&type=js&click_log=&click_type=&load_type=1&clickUrl=';
      _box.appendChild(_s1);
    } catch (e) {
      console.warn('[AD]', e);
    }
  })();
  