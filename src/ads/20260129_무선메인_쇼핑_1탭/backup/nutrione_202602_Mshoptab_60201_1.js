var adTitle = "뉴트리원"
  , adsNo = [240111, 240112, 240113, 240114, 240115]
  , host = "//cyad1.nate.com/js.kti/mnate/"
  , iw = window
  , ipr = iw.parent
  , ads = {
    v: "1.1.30",
    row: 0,
    xRow: 5,
    items: [{
        index: 0,
        list: [],
        data: []
    }],
    iix: -1,
    cEl: null,
    slider: {
        hammer: null,
        tween: null,
        scrollable: !1,
        panStarted: !1,
        tweenBack: null,
        originX: 0
    },
    timeStamp: 0,
    layout: {
        container: {
            pTop: 8,
            pRight: 9.5,
            pBottom: 6,
            pLeft: 9.5
        },
        item: {
            width: 130,
            height: 115,
            pLeft: 3.5,
            pRight: 3.5
        }
    },
    setAds: function(t) {
        if (t) {
            var e = this.iix
              , i = ads.items
              , n = i[e];
            if (n.data.push(t),
            !(0 <= e && i[e].data.length < this.xRow)) {
                ads.shuffle(n.data);
                var a, s, r, o = n.data, d = o.length, l = $(".mduPhotoList[data-id=" + e + "]");
                for (a = 0; a < d; a++)
                    (r = {
                        img: o[a].img,
                        index: o[a].index,
                        link: o[a].link
                    }).img = this.prefixUrl(r.img),
                    s = l.find("li:eq(" + a + ")"),
                    ads.renderItem(s, r, a)
            }
        }
    },
    prefixUrl: function(t) {
        var e = iw.location.protocol;
        return /^http[s]?:/.test(e) && (t = t.replace(/http:/g, e).replace(/https:/g, e)),
        /^\/\/\w+?/.test(t) && (t = e + t),
        /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, e + "//").replace(/https\/\//g, e + "//")),
        t
    },
    renderItem: function(t, e) {
        t.length && t.find(".image > img").attr("src", e.img)
    },
    shuffle: function(t) {
        for (var e = t.length - 1; 0 <= e; e--) {
            var i = Math.floor(Math.random() * (e + 1))
              , n = t[i];
            t[i] = t[e],
            t[e] = n
        }
        return t
    },
    frequency: {
        viewCnt: 0,
        viewPreCnt: -1,
        viewMaxCnt: 2,
        isHide: !0
    },
    isViewBound: function(t) {
        var e = ads.frequency
          , i = ads.bd("#ad_big");
        if (e.viewCnt < e.viewMaxCnt && i) {
            var n = ads.rect(i)
              , a = 0 <= n.y
              , s = n.y <= ipr.innerHeight;
            a && s ? e.isHide && (e.isHide = !1,
            e.viewCnt++) : e.isHide = !0
        } else
            e.isHide = !0;
        var r = e.viewPreCnt !== e.viewCnt && !e.isHide;
        return e.viewPreCnt = e.viewCnt,
        r
    },
    qtMotion: function(t) {},
    render: function() {
        var t = [this.iix = 0, 1, 2, 3, 4]
          , e = []
          , i = 0;
        for (i = 0; i < this.xRow; i++)
            e.push({
                ads: host + "shop@contsd_a" + (i + 1) + "_top3?ads_no=" + adsNo[i]
            });
        for (i = 0; i < this.items.length; i++)
            this.items[i].list = e,
            this.items[i].index = t[i];
        var n = this.items[0];
        this.iix = this.row = 0,
        this.header(),
        this.templates.init(n, function() {});
        var o = this;
        iw.screen.orientation ? iw.addEventListener("orientationchange", ads.detectOrientChange) : iw.addEventListener("resize", ads.detectOrientChange),
        this.timeStamp = (new Date).getTime(),
        iw.addEventListener("load", function() {
            try {
                var t = ads.evOpts()
                  , e = document.querySelector(".mduPhotoList");
                o.cEl = e;
                var i = new Hammer.Manager(e,{
                    recognizers: [[Hammer.Pan, {
                        direction: Hammer.DIRECTION_HORIZONTAL
                    }], [Hammer.Tap], [Hammer.Press, {
                        time: 0
                    }]]
                });
                if (i.on("tap", ads.tap),
                i.on("panstart", ads.ps),
                i.on("panend", ads.pe),
                i.on("panleft", ads.pl),
                i.on("panright", ads.pr),
                i.on("press", function() {
                    i.off("press"),
                    ads.tweenStop()
                }, t),
                ads.slider.hammer = i,
                ipr) {
                    var n = ipr.document
                      , a = n.querySelector("#ad_big")
                      , s = document.querySelector("#preimg");
                    a && (a.style.height = "150px",
                    a.style.width = "10px",
                    a.style["min-width"] = "100%"),
                    s && (s.style.display = "none"),
                    ads.qtMotion(a),
                    n.addEventListener("scroll", function(t) {
                        ads.isScrollable() && ads.scrollable(!0);
                        var e = ads.sp();
                        e.overflow && (ads.tweenStop(),
                        ads.mx(ads.cEl, e.overflow.x)),
                        ads.qtMotion(a),
                        t.preventDefault(),
                        t.stopPropagation()
                    }, t);
                    var r = 0;
                    ads.isScrollable() && (e.addEventListener("touchstart", function(t) {
                        cancelAnimationFrame(r),
                        r = requestAnimationFrame(function(t) {
                            ads.scrollable(!1)
                        })
                    }, t),
                    e.addEventListener("touchend", function(t) {
                        cancelAnimationFrame(r),
                        r = requestAnimationFrame(function(t) {
                            ads.scrollable(!1)
                        })
                    }, t),
                    e.addEventListener("touchmove", function(t) {}, t))
                }
                ads.mx(e, 0)
            } catch (t) {}
        })
    },
    isScrollable: function() {
        return /iPad|iPad.*Mobile/g.test(navigator.userAgent) || /\biPhone\b|\biPod\b/g.test(navigator.userAgent)
    },
    scrollable: function(t) {
        return void 0 !== t && (ads.slider.scrollable = !!t),
        ads.slider.scrollable
    },
    evOpts: function() {
        var t = !1;
        try {
            addEventListener("test", null, Object.defineProperty({}, "passive", {
                get: function() {
                    t = !0
                }
            }))
        } catch (t) {}
        return !!t && {
            capture: !1,
            passive: !1
        }
    },
    detectOrientChange: function(t) {
        ads.mx(ads.cEl, 0)
    },
    tweenStart: function(t) {
        ads.tweenStop();
        var e = ads.slider.tween = new TWEEN.Tween(t.start);
        return e.to(t.end, t.duration).delay(t.delay ? t.delay : 0).easing(t.easing ? t.easing : TWEEN.Easing.Back.Out).onUpdate(t.update ? t.update : ads.tweenUpdate).start(),
        ads.tweenAnimate(),
        e
    },
    tweenStop: function() {
        ads.slider.tween && (ads.slider.tween.stop(),
        ads.slider.tween = null),
        ads.slider.tweenBack && (ads.slider.tweenBack.stop(),
        ads.slider.tweenBack = null),
        TWEEN.removeAll()
    },
    tweenAnimate: function(t) {
        var e = requestAnimationFrame(ads.tweenAnimate);
        TWEEN.update(t) || cancelAnimationFrame(e)
    },
    tweenUpdate: function(t, e) {
        var i = ads.sp();
        i.overflow ? ads.tweenStart({
            start: {
                x: i.x
            },
            end: {
                x: i.overflow.x
            },
            duration: 600,
            update: ads.tweenBack
        }) : ads.mx(ads.cEl, t.x)
    },
    tweenBack: function(t, e) {
        ads.mx(ads.cEl, t.x)
    },
    mx: function(t, e) {
        t.style.transform = "translate3d(" + e + "px,0,0)",
        t.style.webkitTransform = t.style.transform
    },
    bd: function(t) {
        return void 0 !== t ? ipr.document.querySelector(t) : document.body
    },
    sp: function() {
        var t = ads.cEl
          , e = ads.rect(t)
          , i = ads.rect(ads.bd())
          , n = i.width < e.width
          , a = i.width - e.width
          , s = e.x < a
          , r = 0 < e.x
          , o = null;
        return (s || r) && n && (o = r ? {
            x: 0
        } : {
            x: a
        }),
        {
            trg: t,
            x: n ? e.x || e.left : 0,
            enable: n,
            minX: a,
            maxX: 0,
            overflow: o
        }
    },
    rect: function(t) {
        var e = (void 0 !== t ? t : ipr.document.body || document.body).getBoundingClientRect();
        return e.x = e.x || e.left,
        e
    },
    cp: function(t) {
        var e = ads.sp()
          , i = 0;
        return (2 === t.direction ? e.x < e.minX : e.x > e.maxX) ? i = Math.min(Math.abs(t.velocityX), 1) * (2 === t.direction ? -1 : 1) : (i = Math.min(10, Math.abs(t.deltaX - ads.slider.originX)),
        2 === t.direction && (i *= -1)),
        ads.slider.originX = t.deltaX,
        e.x + i
    },
    pl: function(t) {
        ads.sp().enable && !ads.scrollable() && ads.mx(ads.cEl, ads.cp(t))
    },
    pr: function(t) {
        ads.sp().enable && !ads.scrollable() && ads.mx(ads.cEl, ads.cp(t))
    },
    pe: function(t) {
        if (ads.tweenStop(),
        !ads.scrollable()) {
            var e = ads.sp();
            if (!e.enable)
                return;
            var i = 2 * t.velocity
              , n = {
                x: e.x + i * ads.layout.item.width
            };
            ads.tweenStart({
                start: {
                    x: e.x
                },
                end: n,
                duration: 800,
                easing: TWEEN.Easing.Cubic.Out
            })
        }
        ads.scrollable(!1)
    },
    ps: function(t) {
        ads.tweenStop(),
        ads.slider.originX = t.deltaX
    },
    tap: function(t) {
        t.preventDefault();
        var e = t.target.getAttribute("data-id");
        if (e) {
            var i = ads.items[0].data[e].link;
            i && iw.open(i, "_blank")
        }
        ads.tweenStop()
    },
    templates: {
        init: function(t, e) {
            for (var i = "", n = 0; n < t.list.length; n++)
                i += this.asyncListItem(t.list[n].ads, n);
            var a = this.listWrap(i, ads.row, !0)
              , s = this.wrap(a);
            document.write(s),
            e()
        },
        listWrap: function(t, e, i) {
            var n = '<ul class="mduPhotoList' + ((i = i || !1) ? "" : " inactive") + '" data-id="' + e + '">                    {{items}}                </ul>';
            return n = n.replace(/{{items}}/, t)
        },
        wrap: function(t) {
            var e = '            <div class="pmAd">{{tpl}}                 <div class="adtit"><span>{{adt}}</span><img src="//adimg.nateimg.co.kr/img/ads_icon/ad_icon3.png" alt="광고 아이콘"></div>             </div>';
            return e = e.replace(/{{tpl}}/, t).replace(/{{adt}}/, adTitle)
        },
        listItem: function(t, e) {
            var i = t.ads;
            return this.asyncListItem(i, e)
        },
        asyncListItem: function(t, e) {
            var i = '<li data-eq="' + e + '">                    <a>                        <div class="image"><img src="" alt="" data-id="' + e + '"></div>                    </a>                </li>';
            return i += t = t ? '<script type="text/javascript" src="' + t + '"><\/script>' : ""
        }
    },
    header: function() {
        iw.innerWidth || document.documentElement.offsetWidth;
        var t, e = ads.layout.container, i = ads.layout.item, n = (i.width + i.pLeft + i.pRight) * ads.xRow + (e.pLeft + e.pRight);
        t = '<style>\n    body{ margin:0; padding:0; font-family: "Noto Sans KR", "돋움", Dotum, Helvetica, sans-serif; letter-spacing: -0.075em; line-height:1.5; overflow: hidden;background: #ffffff;}\n    a {text-decoration:none;color:#222;}\n    ul,ol,li{list-style:none;margin:0;padding:0;}\n    .pmAd { position:relative; width:100%; margin:0 auto; padding:0 0; user-select: none}\n    .adtit { text-align: left; top:126px; right:13px; position:absolute;  font-size:12px; color:#888888; }\n    .adtit img { vertical-align:-3px; padding-left:6px; width:23px; height:13px;}\n    .mduPhotoList{ will-change:transform; position:absolute; padding:' + e.pTop + "px " + e.pLeft + "px " + e.pBottom + "px " + e.pLeft + "px; box-sizing:border-box; -webkit-box-sizing:border-box;width:" + n + "px;  overflow:hidden; }\n    .mduPhotoList li { float:left;  height:" + i.height + "px;overflow:hidden; text-align:left; padding:0 " + i.pLeft + "px 0 " + i.pRight + "px; user-select: none;}\n    .mduPhotoList li .ibl_image_border{\n        width: " + i.width + "px; height: " + i.height + "px;border: 1px solid #cccccc;position: absolute; top: 0;box-sizing:border-box; user-select: none;\n    }\n    .mduPhotoList li a:hover .ibl_image_border{ border-color:#dddddd; }\n    .mduPhotoList li a { position:relative; display:block;}\n    .mduPhotoList li .image { display:block;  width:" + i.width + "px; height:" + i.height + "px;}\n    .mduPhotoList li .image  img { border: none; width:" + i.width + "px; height:" + i.height + "px; -webkit-user-drag: none;}\n    .mduPhotoList li .tit_bg { display: none; }\n    .mduPhotoList li .subject { overflow: hidden; width:" + i.width + "px; }\n    .inactive{display:none;}\n</style>";
        document.write(t),
        document.write('<link href="https://fonts.googleapis.com/earlyaccess/notosanskr.css" rel="stylesheet" type="text/css">        <script type="text/javascript" src="//adimg.nateimg.co.kr/img/static/libs/jquery-3.4.1.min.js" ><\/script>        <script src="//adimg.nateimg.co.kr/img/static/libs/hammer.min.js"><\/script>        <script src="//adimg.nateimg.co.kr/img/static/libs/tween.iife.min.js"><\/script>        ')
    }
};
!function() {
    for (var s = 0, t = ["ms", "moz", "webkit", "o"], e = 0; e < t.length && !iw.requestAnimationFrame; ++e)
        iw.requestAnimationFrame = iw[t[e] + "RequestAnimationFrame"],
        iw.cancelAnimationFrame = iw[t[e] + "CancelAnimationFrame"] || iw[t[e] + "CancelRequestAnimationFrame"];
    iw.requestAnimationFrame || (iw.requestAnimationFrame = function(t, e) {
        var i = (new Date).getTime()
          , n = Math.max(0, 16 - (i - s))
          , a = iw.setTimeout(function() {
            return t(i + n)
        }, n);
        return s = i + n,
        a
    }
    ),
    iw.cancelAnimationFrame || (iw.cancelAnimationFrame = function(t) {
        clearTimeout(t)
    }
    )
}(),
ads.render();
