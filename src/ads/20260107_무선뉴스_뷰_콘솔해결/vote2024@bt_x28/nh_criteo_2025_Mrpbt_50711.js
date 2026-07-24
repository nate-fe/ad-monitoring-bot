//! open-rtb v1.0.13.7 !Fri Apr 24 2020 16:57:02
var rtb_conf = {
  area : "area",
  width : "320",
  height : "100",
  ads_no : "%#ads_no%#",
  minCPM : "100",
  page_url : location.protocol+'//'+location.hostname,
  selectorId : 'main_banner', // ad-area div id
  parentId: window.name, // parent div id
  timeout:1000
};

//! open-rtb v1.0.16.0 !Wed Oct 12 2022 17:53:07 
!function(c){var t,h=parent!==self,l=c.rtb_conf;l.page_url=encodeURIComponent(l.page_url);var n,r,a="https://sbm.nate.com/getRTB?"+("area="+l.area+"&height="+l.height+"&width="+l.width+"&page_url="+l.page_url+"&ads_no="+l.ads_no+"&minCPM="+l.minCPM),i=function(e){try{var n=document.querySelector("#"+e);return!!n&&function(e,t){o(e,n)}}catch(t){return!1}};function d(){clearTimeout(t),n&&(n.removeEventListener("load",p),n.removeEventListener("error",u))}function o(e,t){e=e||"";var n=t;n||(n=document.createElement("div"),document.getElementsByTagName("body")[0].appendChild(n),n.setAttribute("id",l.selectorId)),n.style.height=l.height+"px";try{if(h&&l.parentId&&parent.document){var r=parent.document.querySelector("#"+l.parentId);r&&(r.style.height=l.height+"px")}}catch(s){var a=-1<location.href.indexOf("news"),o=-1<location.href.indexOf("pann");a&&c.parent.postMessage({method:"fnct",name:"callCrossOriginAd",property:{target:l.parentId,height:l.height}},"*"),o&&c.parent.postMessage({target:l.parentId,params:{height:l.height}},"*")}var i=document.createElement("iframe");i.frameBorder="none",i.scrolling="no",i.style.overflow="hidden",i.width=l.width,i.height=l.height,n.appendChild(i);var d=i.contentWindow.document;e="<style>body{margin:0; padding: 0;}</style>"+e,d.write("<!DOCTYPE html>"),d.write(e),d.close()}function s(){try{var e=document.querySelector("#"+l.selectorId);o(function t(){var e=l.passback?l.passback:"mnate/news_rtb@rpbt_Bottom1";return'<div id="'+l.selectorId+'" style="width:'+l.width+"px;height:"+l.height+'px"><script src="https://cyad1.nate.com/js.kti/'+e+'"><\/script></div>'}(),e)}catch(n){}}function p(e){var t=e.target;if(d(),400===t.status)u();else if(t.response)try{var n=JSON.parse(t.response)||{},r=function a(e){return e=!/^<script/.test(e)&&e?e:null}(n.code||"");if(!r)return u(),!1;i(r,n)}catch(o){u()}else u()}function u(e){d(),s()}l.selectorId=(l.selectorId||"").replace(/\s+/,""),l.parentId=(l.parentId||"").replace(/\s+/,""),c.addEventListener("load",r=function(){!function e(){(i=i(l.selectorId))?(t=setTimeout(function(){u()},rtb_conf.timeout),(n=new XMLHttpRequest).addEventListener("load",p),n.addEventListener("error",u),n.open("get",a,!0),n.withCredentials=!0,n.send()):s()}(),c.removeEventListener("load",r),r=null})}(window);