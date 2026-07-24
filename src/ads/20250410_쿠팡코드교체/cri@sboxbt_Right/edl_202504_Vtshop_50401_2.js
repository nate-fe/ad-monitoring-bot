(function() {
    try{
        var areaShoppingToday = document.querySelector('.area_shopping_today');
        var _script = document.createElement('script');
        _script.src = 'https://api.adsrv.co.kr/sa2/kw-req?subId=natepcmain332x231&trackingCode=AF0700373';
        if (areaShoppingToday) {
            areaShoppingToday.appendChild(_script);
            areaShoppingToday.style.padding = '0';
            areaShoppingToday.style.width = '332px';
            areaShoppingToday.style.height = '231px';
            areaShoppingToday.style.border = 'none';
        }
    } catch(err) {console.log(err)}
  })()