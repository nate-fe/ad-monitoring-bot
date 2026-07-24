(function() {
  var _adWidth = 300;
  var _adHeight = 250;
  var $main_banner = document.getElementById('main_banner');
  var _script = document.createElement('script');
  _script.src = 'https://cp.edl.co.kr/cou/api_reco.php?code=natenews3&adid=&type=coujs&rt=1';
  if ($main_banner) {
    $main_banner.appendChild(_script);
  }  
})();