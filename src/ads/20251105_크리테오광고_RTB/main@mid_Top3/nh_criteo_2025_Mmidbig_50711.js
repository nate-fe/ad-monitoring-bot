var isApp = navigator.userAgent.match(/ref:nate_app/i);
var pass_url = isApp ? 'mnate/cri@mainmid_Top3' : 'mnate/cri@mainmid_Top3?exception_ads=209961';

var rtb_conf = {
    area: "Mmidbig",
    width: "320",
    height: "200",
    ads_no: "%#ads_no%#",
    minCPM: "500",
    page_url: location.protocol + '//' + location.hostname,
    selectorId: "top_main_banner", // ad-area div id
    parentId: "ad_mid", // parent div id
    timeout: 300,
    passback: pass_url
};


//! open-rtb v1.0.16.1 !Tue Oct 18 2022 17:03:32 
!function (c) { var t, h = parent !== self, l = c.rtb_conf; l.page_url = encodeURIComponent(l.page_url); var n, r, a = "https://sbm.nate.com/getRTB?" + ("area=" + l.area + "&height=" + l.height + "&width=" + l.width + "&page_url=" + l.page_url + "&ads_no=" + l.ads_no + "&minCPM=" + l.minCPM), o = function (e) { try { var n = document.querySelector("#" + e); return !!n && function (e, t) { i(e, n) } } catch (t) { return !1 } }; function s() { clearTimeout(t), n && (n.removeEventListener("load", p), n.removeEventListener("error", u)) } function i(e, t) { e = e || ""; var n = t; n || (n = document.createElement("div"), document.getElementsByTagName("body")[0].appendChild(n), n.setAttribute("id", l.selectorId)), n.style.height = l.height + "px"; try { if (h && l.parentId && parent.document) { var r = parent.document.querySelector("#" + l.parentId); r && (r.style.height = l.height + "px", r.getElementsByTagName("iframe")[0].style.height = l.height + "px") } } catch (d) { var a = -1 < location.href.indexOf("news"), i = -1 < location.href.indexOf("pann"); a && c.parent.postMessage({ method: "fnct", name: "callCrossOriginAd", property: { target: l.parentId, height: l.height } }, "*"), i && c.parent.postMessage({ target: l.parentId, params: { height: l.height } }, "*") } var o = document.createElement("iframe"); o.frameBorder = "none", o.scrolling = "no", o.style.overflow = "hidden", o.width = l.width, o.height = l.height, n.appendChild(o); var s = o.contentWindow.document; e = "<style>body{margin:0; padding: 0;}</style>" + e, s.write("<!DOCTYPE html>"), s.write(e), s.close() } function d() { try { var e = document.querySelector("#" + l.selectorId); i(function t() { var e = l.passback ? l.passback : "mnate/news_rtb@rpbt_Bottom1"; return '<div id="' + l.selectorId + '" style="width:' + l.width + "px;height:" + l.height + 'px"><script src="https://cyad1.nate.com/js.kti/' + e + '"><\/script></div>' }(), e) } catch (n) { } } function p(e) { var t = e.target; if (s(), 400 === t.status) u(); else if (t.response) try { var n = JSON.parse(t.response) || {}, r = function a(e) { return e = !/^<script/.test(e) && e ? e : null }(n.code || ""); if (!r) return u(), !1; o(r, n) } catch (i) { u() } else u() } function u(e) { s(), d() } l.selectorId = (l.selectorId || "").replace(/\s+/, ""), l.parentId = (l.parentId || "").replace(/\s+/, ""), c.addEventListener("load", r = function () { !function e() { (o = o(l.selectorId)) ? (t = setTimeout(function () { u() }, rtb_conf.timeout), (n = new XMLHttpRequest).addEventListener("load", p), n.addEventListener("error", u), n.open("get", a, !0), n.withCredentials = !0, n.send()) : d() }(), c.removeEventListener("load", r), r = null }) }(window);