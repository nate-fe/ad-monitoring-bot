(function() {
    try{
        var adBetweenList = document.querySelector('#ad_between_list');
        var _iframe = document.createElement('iframe');
        _iframe.src = '//ads-partners.coupang.com/widgets.html?id=755773&trackingCode=AF0700373&subId=nate320x200&width=320&height=200&template=trending-keyword';
        _iframe.width = 320;
        _iframe.height = 200;
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('referrerpolicy', 'unsafe-url');
        adBetweenList.appendChild(_iframe);
    }catch(err){console.warn(err)}  
  })();

//   <iframe
// src="https://ads-partners.coupang.com/widgets.html?id=755773&trackingCode=AF0700373&subId=nate320x200&width=320&height=200&template=trending-keyword" width="320" height="200" frameborder="0" scrolling="no" referrerpolicy="unsafe-url">
// </iframe>