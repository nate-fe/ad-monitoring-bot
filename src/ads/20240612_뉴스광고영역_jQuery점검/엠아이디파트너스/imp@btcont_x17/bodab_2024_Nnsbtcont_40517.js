var iblTitle = "올 여름 Hot issue!",
  host = "//cyad1.nate.com/js.kti/nate/",
  ads = {
    version: "3.1.2",
    nPages: 1,
    curPageRow: 0,
    nMaxRow: 4,
    adsList: [
      [
        { ads: host + "news@btcont_a1_x17" },
        { ads: host + "news@btcont_a2_x17" },
        { ads: host + "news@btcont_a3_x17" },
        { ads: host + "news@btcont_a4_x17" },
      ],
    ],
    items: [
      { index: 0, list: [], data: [] },
      { index: 1, list: [], data: [] },
      { index: 2, list: [], data: [] },
      { index: 3, list: [], data: [] },
    ],
    itemsIndex: [0, 1, 2, 3],
    itemsPool: [],
    itemInputIndex: -1,
    setAds: function (data) {
      if (data) {
        var listIndex = this.itemInputIndex,
          items = ads.items,
          curItem = items[listIndex];
        if (
          (curItem.data.push(data),
          !(0 <= listIndex && items[listIndex].data.length < this.nMaxRow))
        ) {
          ads.shuffle(curItem.data);
          var i,
            $item,
            _data,
            list = curItem.data,
            len = list.length,
            $list = $(".mduPhotoList[data-id=" + listIndex + "]");
          for (i = 0; i < len; i++)
            ((_data = {
              img: list[i].img,
              img2: list[i].img2,
              index: list[i].index,
              link: list[i].link,
              title: list[i].title,
              title2: list[i].title2,
              title3: list[i].title3,
            }).img = this.prefixUrl(_data.img)),
              (_data.img2 = this.prefixUrl(_data.img2)),
              0 < i && (_data.img = _data.img2),
              ($item = $list.find("li:eq(" + i + ")")),
              ads.renderItem($item, _data, i);
        }
      }
    },
    prefixUrl: function (uriString) {
      var protocol = window.location.protocol;
      return (
        /^http[s]?:/.test(protocol) &&
          (uriString = uriString
            .replace(/http:/g, protocol)
            .replace(/https:/g, protocol)),
        /^\/\/\w+?/.test(uriString) && (uriString = protocol + uriString),
        /^http[s]?\/\//.test(uriString) &&
          (uriString = uriString
            .replace(/http\/\//g, protocol + "//")
            .replace(/https\/\//g, protocol + "//")),
        uriString
      );
    },
    renderItem: function ($item, data, i) {
      if ($item.length) {
        var $prevObject = $item
            .find("a")
            .attr("href", data.link)
            .find(".image > img")
            .attr("src", data.img).prevObject,
          tit = $prevObject.find(".tit"),
          tit2 = $prevObject.find(".tit2"),
          tit3 = $prevObject.find(".tit3");
        tit.text(data.title),
          0 === i
            ? (tit.removeClass("inactive"),
              tit2.addClass("inactive"),
              tit3.addClass("inactive"))
            : (tit.addClass("inactive"),
              tit2.removeClass("inactive"),
              tit3.removeClass("inactive")),
          data.title2 && tit2.length && tit2.text(data.title2),
          data.title3 && tit3.length && tit3.text(data.title3);
      }
    },
    shuffle: function (input) {
      for (var i = input.length - 1; 0 <= i; i--) {
        var randomIndex = Math.floor(Math.random() * (i + 1)),
          itemAtIndex = input[randomIndex];
        (input[randomIndex] = input[i]), (input[i] = itemAtIndex);
      }
      return input;
    },
    render: function () {
      for (
        var adsIndex = [(this.itemInputIndex = 0), 1, 2, 3], i = 0;
        i < this.items.length;
        i++
      )
        (this.items[i].list = this.adsList[i]),
          (this.items[i].index = adsIndex[i]);
      delete this.adsList;
      var item = this.items[0];
      (this.itemInputIndex = this.curPageRow = 0),
        this.header(),
        this.templates.init(item, function () {});
    },
    changeNav: function (context) {
      var className = context.className;
      if ($(".mduPhotoList").length) {
        ads.curPageRow;
        var validate = this.validateList(className);
        validate.next.length
          ? this.next(validate.index)
          : this.loadAds(validate.index);
      }
    },
    validateList: function (v) {
      var $list = $(".mduPhotoList"),
        idx = ads.curPageRow;
      return (
        /prev/.test(v)
          ? (idx = --idx < 0 ? ads.nPages + idx : idx)
          : /next/.test(v) && (idx = ++idx % ads.nPages),
        { index: idx, next: $list.filter("[data-id=" + idx + "]") }
      );
    },
    loadAds: function (idx, fn) {
      var items = this.items[idx],
        listItemTpl = "";
      this.itemInputIndex = idx;
      var i = 0;
      for (i = 0; i < items.list.length; i++)
        listItemTpl += this.templates.asyncListItem("", i);
      var list = this.templates.listWrap(listItemTpl, idx);
      $(".pmAd").append(list);
      var self = this;
      for (i = 0; i < items.list.length; i++)
        $.ajax(items.list[i].ads, {
          dataType: "script",
          charset: "euc-kr",
        }).done(function (d) {
          items.data.length >= self.nMaxRow && ads.next(idx);
        });
    },
    next: function (page) {
      $(".mduPhotoList").filter(".inactive").remove();
    },
    templates: {
      init: function (items, fn) {
        for (var listItemTpl = "", i = 0; i < items.list.length; i++)
          listItemTpl += this.asyncListItem(items.list[i].ads, i);
        var list = this.listWrap(listItemTpl, ads.curPageRow, !0),
          wrap = this.wrap(list);
        1 < ads.nPages && (wrap += this.nav(ads.curPageRow)),
          document.write(wrap),
          fn();
      },
      listWrap: function (itemTemplate, index, activated) {
        var listWrap =
          '<ul class="mduPhotoList' +
          ((activated = activated || !1) ? "" : " inactive") +
          '" data-id="' +
          index +
          '">                    {{items}}                </ul>';
        return (listWrap = listWrap.replace(/{{items}}/, itemTemplate));
      },
      nav: function (page) {
        return (
          '<div class="paging_navi">                    <a href="javascript:void(0);" class="prev" onclick="ads.changeNav(this)" title="이전">이전</a>                    <span><strong class="pageNum">' +
          (page + 1) +
          '</strong>/3</span>                    <a href="javascript:void(0);" class="next" onclick="ads.changeNav(this)" title="다음">다음</a>                </div>'
        );
      },
      wrap: function (listTpl) {
        return (
          '<div class="pmAd">                    <div class="adtit">                   ' +
          iblTitle +
          "                    </div>" +
          (listTpl || "") +
          "</div>"
        );
      },
      listItem: function (item, idx) {
        var adsSrc = item.ads;
        return this.asyncListItem(adsSrc, idx);
      },
      asyncListItem: function (adsSrc, idx) {
        var tag =
          '<li data-eq="' +
          idx +
          '">                    <a href="javascript:void(0);" target="_blank">                        <div class="image"><img src="" alt=""></div>                        <div class="subject">                            <img src="//adimg.nateimg.co.kr/img/ads_icon/ibl_tit_bg5.png" class="tit_bg" />                            <span class="tit inactive"></span><span class="tit2 inactive"></span><span class="tit3 inactive"></span>                        </div>                        <div class="ibl_image_border"></div>                     </a>                </li>';
        return (tag += adsSrc =
          adsSrc
            ? '<script type="text/javascript" src="' +
              adsSrc +
              '" charset="euc-kr"></script>'
            : "");
      },
    },
    header: function () {
      var css;
      css =
        '<style>\n    body{ margin:0; padding:0; font-family:"돋움", Dotum, Helvetica, sans-serif; line-height:1.5; overflow: hidden;background: #f9f9f9;}\n    a {text-decoration:none;color:#222;}\n    ul,ol,li{list-style:none;margin:0;padding:0;}\n    .pmAd { position:relative; width:250px; margin:0 auto; padding:0 0; }\n    .adtit { padding:0 0 6px 0; font-weight:bold; font-size:12px; color:#333; }\n    .adtit img { vertical-align:-3px; position:absolute; right:40px;margin-top:-3px; }\n    .mduPhotoList{ padding:10px -45px 0 -45px; box-sizing:border-box; -webkit-box-sizing:border-box; overflow:hidden; }\n    .mduPhotoList li { float:left;  height:110px;overflow:hidden; text-align:left;}\n    .mduPhotoList li:first-child { width:250px; height:128px; padding-bottom: 5px;}\n    .mduPhotoList li:first-child  .image{width:250px; height:128px;}\n    .mduPhotoList li:first-child .tit{       font: 14px Dotum, Helvetica, sans-serif; color:#FFFFFF;letter-spacing: 0.02em;white-space: normal;       left:0; bottom: 0;position: absolute;padding:0 8px; width:234px;height: 37px;line-height:2.8em;text-overflow: ellipsis;    }\n    .mduPhotoList li:first-child .subject{ position: absolute;bottom:0; width:250px;  height: 37px;}\n        .mduPhotoList li:first-child .tit_bg{ display: block; border:none; width:250px;height: 37px;position: absolute; bottom: 0;left: 0;}\n    .mduPhotoList li:first-child .tit2{display: none;}\n    .mduPhotoList li:first-child .tit3{display: none;}\n    .mduPhotoList li:first-child  a{padding:0;}\n    .mduPhotoList li .ibl_image_border{\n        width: 80px; height: 80px;border: 1px solid #cccccc;position: absolute; top: 0;box-sizing: border-box;pointer-events: none;\n    }\n    .mduPhotoList li:first-child .ibl_image_border{width: 250px; height: 128px;}\n    .mduPhotoList li:nth-of-type(3), .mduPhotoList li:nth-of-type(4){ padding-left: 5px; }\n    .mduPhotoList li[data-eq="2"] ,.mduPhotoList li[data-eq="3"]{padding-left: 5px;}\n    .mduPhotoList li a:hover .ibl_image_border{ border-color:#dddddd; }\n    .mduPhotoList li a { position:relative; display:block;}\n    .mduPhotoList li .image { display:block; width:80px; height:80px;}\n    .mduPhotoList li a .image  img { border: none; }\n    .mduPhotoList li:not(:first-child) .tit { display: none; }\n    .mduPhotoList li .tit_bg { display: none; }\n    .tit2 {  letter-spacing: -1px;display:block; color:#444444; height: 14px;position: relative;font-size: 11px;text-align: center;padding-top:3px;}\n    .tit3 {  letter-spacing: -1px;display:block; color:#444444; height: 14px;position: relative;font-size: 11px;text-align: center;}\n    a:hover .tit { text-decoration:underline; }\n    a:hover .tit2 { text-decoration:underline; }\n    a:hover .tit3 { text-decoration:underline; }\n    .mduPhotoList li .subject { overflow: hidden; width:80px; }\n    .paging_navi { float:right; position:relative; bottom:15px; right:' +
        (((window.innerWidth || document.documentElement.offsetWidth) - 250) /
          2 +
          35) +
        'px; }\n    .paging_navi a { display:block; position:absolute; top:2px; width:16px; height:16px; text-indent:-10000em; overflow:hidden; background:url("//adimg.nateimg.co.kr/img/2018/01/ads_icon/btn_arrow.gif") left top no-repeat; }\n    .paging_navi a.prev { left:0; background-position:1px 0; }\n    .paging_navi a.next { right:0; background-position:-22px 0; }\n    .paging_navi span { display:block; padding:2px 17px 0 17px; font-family:Verdana, sans-serif; font-size:12px; color:#666; }\n    .inactive{display:none;}\n</style>';
      document.write(css),
        document.write(
          '<script type="text/javascript" src="//news.nate.com/js/jquery-1.8.3.min.js" ></script>'
        );
    },
    refresh: function (time) {
      function timeout(fn) {
        setTimeout(fn, 1e4);
      }
      var self = this,
        cnt = 0,
        loadfn = function () {
          cnt++;
          var data = self.items[0].data;
          self.items[0].data = [];
          for (var i = 0; i < data.length; i++) self.setAds(data[i]);
          cnt < 300 && timeout(loadfn);
        };
      timeout(loadfn);
    },
  };
function isXPLowerIE8() {
  var ua = navigator.userAgent.toLowerCase(),
    ie =
      (-1 < ua.indexOf("NT 5.1") || ua.indexOf("SV1"),
      -1 !== ua.indexOf("msie") && parseInt(ua.split("msie")[1]));
  return !!(ie && ie <= 8);
}
ads.render(), ads.refresh();
