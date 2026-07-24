(function () {
    try{
        var script = document.createElement('script');
        script.src = '//ads-partners.coupang.com/g.js';
        script.onload = function() {
            new PartnersCoupang.G( {"id":797988,"template":"carousel","trackingCode":"AF4742324","width":"100%","height":"400","tsource":""});
        }
        document.getElementById('main_banner').appendChild(script);
    }catch(err){consolw.warn(err)}
})();
  