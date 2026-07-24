try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

var bgcolor   = '#f8f8f8';
var img_path  = CyadLib.prefixUrl('https://adimg.nate.com/img/2025/03/google/google_cp_0305_300x250.png');	//이미지 소재 경로
var alt_text  = '광고';
var adsEl     = '<a href="//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#" style="background:'+bgcolor+'" target="_top"><img alt="'+alt_text+'" src="'+img_path+'" width="300" height="250"></a>';
try {
  var target = document.getElementById('ad_innerView');
  target.innerHTML = adsEl;
}catch(e){
  document.write(adsEl);
}
