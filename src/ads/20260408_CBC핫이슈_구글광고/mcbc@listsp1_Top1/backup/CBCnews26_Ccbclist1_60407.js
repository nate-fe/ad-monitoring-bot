try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

try{
  var img_path  = CyadLib.prefixUrl('https://adimg.nate.com/img/2026/04/cbc/cbc_m1_640x100.jpg');	//이미지 소재 경로 
  var adsEl = '<a href="//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#" target="_blank">\
  <img src="'+img_path+'" width="640" height="100" border="0" alt="광고"></a>';
  document.write(adsEl);
} catch (e) {}
