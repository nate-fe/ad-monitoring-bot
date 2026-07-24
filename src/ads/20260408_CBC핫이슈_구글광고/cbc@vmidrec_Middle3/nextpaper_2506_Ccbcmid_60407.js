(function () {
  var $ad_view = document.getElementById("ad_innerView");

  // DOM에서 다 그려진 후에 작동
  function loadScriptInAd() {
    let activeSlots = 2;

    window.googletag = window.googletag || { cmd: [] };

    function removeEmptySlot(slotId, adItemId) {
      const adItem = document.getElementById(adItemId);
      if (adItem) {
        adItem.remove();
        console.log(`빈 슬롯 제거됨: ${slotId}`);
      }
      activeSlots--;
      if (activeSlots === 0) {
        const container = document.getElementById("ad-row-container");
        if (container) {
          container.style.display = "none";
          console.log("모든 광고가 비어있어 컨테이너를 숨김");
        }
      }
    }

    googletag.cmd.push(function () {
      const pubads = googletag.pubads().set("page_url", "//nate.com");

      pubads.enableLazyLoad({
        fetchMarginPercent: 200,
        renderMarginPercent: 100,
        mobileScaling: 2.0,
      });

      googletag.pubads().addEventListener("slotRenderEnded", function (event) {
        const slotId = event.slot.getSlotElementId();
        if (event.isEmpty) {
          if (slotId === "S003_nate_pc_ap_bottom04_300x250") {
            removeEmptySlot(slotId, "ad-item-1");
          } else if (slotId === "S003_nate_pc_ap_bottom05_300x250") {
            removeEmptySlot(slotId, "ad-item-2");
          }
        }
      });

      // 슬롯1
      googletag
        .defineSlot(
          "/21682743634,22664242840/S003/nate_pc_ap_bottom04_300x250",
          [300, 250],
          "S003_nate_pc_ap_bottom04_300x250",
        )
        .setCollapseEmptyDiv(true)
        .addService(pubads);

      // 슬롯2
      googletag
        .defineSlot(
          "/21682743634,22664242840/S003/nate_pc_ap_bottom05_300x250",
          [300, 250],
          "S003_nate_pc_ap_bottom05_300x250",
        )
        .setCollapseEmptyDiv(true)
        .addService(pubads);

      pubads.enableSingleRequest();
      googletag.enableServices();

      googletag.display("S003_nate_pc_ap_bottom04_300x250");
      googletag.display("S003_nate_pc_ap_bottom05_300x250");
    });
  }

  if ($ad_view) {
    try {
      var _adContainerContent = document.createElement("div");
      var _style = document.createElement("style");
      var _css = `
            .ad-container-content{ /* background-color:#E6E6E6; */ } .ad-row { display:flex; justify-content:center; gap:10px; } .ad-slot { min-width:300px; min-height:250px; position:relative; align-content:center; }
            .ad-item { min-width:300px; min-height:250px; position:relative; border:1px solid rgba(0,0,0,0.2); background-color:#000; }
            .ad-label { border:1px solid rgba(0,0,0,0.2); width:28px; height:18px; position:absolute; top:0; left:0; background-color:rgba(0,0,0,0.5); color:#fff; font-size:12px; font-weight:bold; padding:0; z-index:10; text-align:center; line-height:18px; } `;
      var _lib = document.createElement("script");
      var _adRow = document.createElement("div");
      var _head = document.head || document.getElementsByTagName("head")[0];
      _adContainerContent.classList.add("ad-container-content");
      _style.appendChild(document.createTextNode(_css));
      _lib.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
      _lib.async = true;
      _head.appendChild(_style);
      _head.appendChild(_lib);
      _adRow.classList.add("ad-row");
      _adRow.setAttribute("id", "ad-row-container");

      var slotIds = [
        "S003_nate_pc_ap_bottom04_300x250",
        "S003_nate_pc_ap_bottom05_300x250",
      ];

      for (var i = 0; i < slotIds.length; i++) {
        var _adItem = document.createElement("div");
        var _adLabel = document.createElement("div");
        var _adSlot = document.createElement("div");
        _adItem.classList.add("ad-item");
        _adItem.setAttribute("id", "ad-item-" + (i + 1));
        _adLabel.classList.add("ad-label");
        _adLabel.innerText = "AD";
        _adLabel.style.setProperty("font-size", "12px", "important");
        _adSlot.classList.add("ad-slot");
        _adSlot.setAttribute("id", slotIds[i]);
        _adItem.appendChild(_adLabel);
        _adItem.appendChild(_adSlot);
        _adRow.appendChild(_adItem);
      }

      _adContainerContent.appendChild(_adRow);
      $ad_view.appendChild(_adContainerContent);
      // DOM에 그린 후 함수 호출
      loadScriptInAd();
    } catch (err) {
      console.warn(err);
    }
  }
})();
