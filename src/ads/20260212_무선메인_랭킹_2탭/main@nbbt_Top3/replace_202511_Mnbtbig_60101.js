(function () {
    var ad_height = 250;
    try {
        var iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = ad_height;
        iframe.setAttribute('frameborder', 0);
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('referrerpolicy', 'unsafe-url');
        iframe.src = '//ads-partners.coupang.com/widgets.html?id=661012&template=carousel&trackingCode=AF1185740&subId=ntm640400&width=640&height=250&tsource=www.nate.com';
        var myFrame = window.frameElement; 
        if (myFrame && myFrame.name === "ad_small") {
            myFrame.height = ad_height;
        }
        document.body.appendChild(iframe);
    } catch (err) { }
})();