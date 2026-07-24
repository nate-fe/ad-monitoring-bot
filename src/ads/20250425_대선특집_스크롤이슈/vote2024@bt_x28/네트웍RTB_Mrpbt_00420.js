//! open-rtb v1.0.13.7 !Fri Apr 24 2020 16:57:02
var rtb_conf = {
    area : "area",
    width : "320",
    height : "100",
    ads_no : "%#ads_no%#",
    minCPM : "100",
    page_url : location.protocol+'//'+location.hostname,
    selectorId : 'main_banner', // ad-area div id
    parentId: 'adtive', // parent div id
    timeout:1000
  };
  !function(t){var n,d=parent!==self,s=t.rtb_conf;s.page_url=encodeURIComponent(s.page_url);var r,o,i="https://sbm.nate.com/getRTB?"+("area="+s.area+"&height="+s.height+"&width="+s.width+"&page_url="+s.page_url+"&ads_no="+s.ads_no+"&minCPM="+s.minCPM),a=function(e){try{var n=document.querySelector("#"+e);return!!n&&function(e,t){l(e,n,t)}}catch(t){return!1}};if(d)try{document.domain="nate.com"}catch(m){}function c(e){clearTimeout(n),r&&(r.removeEventListener("load",p),r.removeEventListener("error",h))}function l(e,t,n){e=e||"";var r=t;r||(r=document.createElement("div"),document.getElementsByTagName("body")[0].appendChild(r),r.setAttribute("id",s.selectorId)),r.style.height=s.height+"px";try{if(d&&s.parentId&&parent.document){var o=parent.document.querySelector("#"+s.parentId);o&&(o.style.height=s.height+"px")}}catch(m){}var i=document.createElement("iframe");i.frameBorder="none",i.scrolling="no",i.style.overflow="hidden",i.width=s.width,i.height=s.height,r.appendChild(i);var a=i.contentWindow.document,c="";n&&"WDR"===n.winner&&(c='<script src="//cyad1.nate.com/js.kti/mnate/wider@house_x01"><\/script>'),e="<style>body{margin:0; padding: 0;}</style>"+c+e,a.write(e),a.close()}function u(){try{var e=document.querySelector("#"+s.selectorId);l(function t(){var e=s.passback?s.passback:"mnate/news_rtb@rpbt_Bottom1";return'<div id="'+s.selectorId+'" style="width:'+s.width+"px;height:"+s.height+'px"><script src="https://cyad1.nate.com/js.kti/'+e+'"><\/script></div>'}(),e)}catch(m){}}function p(e){var t=e.target;if(c(),400===t.status)h();else if(t.response)try{var n=JSON.parse(t.response)||{},r=function o(e){return e=!/^<script/.test(e)&&e?e:null}(n.code||"");if(!r)return h("invalidate code"),!1;a(r,n)}catch(m){h("reseponse parse error")}else h("not response data")}function h(e){c(),u()}s.selectorId=(s.selectorId||"").replace(/\s+/,""),s.parentId=(s.parentId||"").replace(/\s+/,""),t.addEventListener("load",o=function(){!function e(){(a=a(s.selectorId))?(n=setTimeout(function(){h("timeout")},rtb_conf.timeout),(r=new XMLHttpRequest).addEventListener("load",p),r.addEventListener("error",h),r.open("get",i,!0),r.withCredentials=!0,r.send()):u()}(),t.removeEventListener("load",o),o=null})}(window);
if (parent.document.getElementById('election2024_bottom')) {
    parent.document.getElementById('election2024_bottom').style.width = '320px';
}