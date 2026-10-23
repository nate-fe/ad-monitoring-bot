(function () {
    try {
      var _script = document.currentScript;
      var _adArea = _script && _script.parentNode;
      if (!_adArea || _adArea === document.head) return;
  
      var _box = document.createElement('div');
      _box.style.textAlign = 'center';
      _adArea.appendChild(_box);
  
      var _s1 = document.createElement('script');
      _s1.src = 'https://api.haimlabs.co.kr/cou/kw/api_reco.php?code=ckhint3002506013m&adid=&type=js&click_log=&click_type=&load_type=1';
      _box.appendChild(_s1);
    } catch (e) {
      console.warn('[AD]', e);
    }
  })();
  