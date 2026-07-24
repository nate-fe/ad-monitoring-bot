(function() {
    try{
        var areaShoppingToday = document.querySelector('.area_shopping_today');
        var _iframe = document.createElement('iframe');
        _iframe.src = 'https://ads-partners.coupang.com/widgets.html?id=755773&trackingCode=AF0700373&subId=natepc3main332x231&width=332&height=231&template=trending-keyword';
        _iframe.width = 332;
        _iframe.height = 231;
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('referrerpolicy', 'unsafe-url');
        areaShoppingToday.style.padding = '0';
        areaShoppingToday.style.border = 'none';
        areaShoppingToday.style.width = '332px';
        areaShoppingToday.style.height = '231px';
        areaShoppingToday.appendChild(_iframe);
    }catch(err){console.warn(err)}  
  })();
  
  // 참고 : news_na_202403_Nnsbtcont_40311