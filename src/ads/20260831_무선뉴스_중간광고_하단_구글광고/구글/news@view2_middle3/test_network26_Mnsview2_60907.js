try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}
var bgcolor   = '#dadada';
var img_path  = CyadLib.prefixUrl('https://adimg.nate.com/img/2026/09/test/test_nsview2_0908_366x500.png');	//이미지 소재 경로
var alt_text  = '광고';
var adsEl     = '<a href="//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#" style="background:'+bgcolor+'" target="_top"><img alt="'+alt_text+'" src="'+img_path+'" width="183" height="250"></a>';

// iframe 내부에 들어갈 문서
var frameDoc = '<!DOCTYPE html><html><head><meta charset="utf-8">'
  + '<style>html,body{margin:0;padding:0;height:100%;background:' + bgcolor + ';}'
  + 'body{display:flex;align-items:center;justify-content:center;overflow:hidden;}'
  + 'a{display:block;line-height:0;}img{display:block;border:0;}</style>'
  + '</head><body>' + adsEl + '</body></html>';

var iframe = document.createElement('iframe');
iframe.setAttribute('frameborder', '0');
iframe.setAttribute('scrolling', 'no');
iframe.setAttribute('allowtransparency', 'true');
iframe.setAttribute('title', alt_text);
iframe.style.cssText = 'display:block;width:100%;min-width:250px;height:500px;border:0;overflow:hidden;background:' + bgcolor + ';';

function writeFrame(f){
  try{
    var d = f.contentWindow.document;
    d.open(); d.write(frameDoc); d.close();
  }catch(e){
    f.setAttribute('srcdoc', frameDoc.replace(/"/g, '&quot;'));
  }
}

try{
  var target = document.getElementById('ad_innerView2');
  target.innerHTML = '';
  target.appendChild(iframe);
  writeFrame(iframe);
}catch(e){
  var fid = 'cyad_frame_' + (+new Date()) + Math.floor(Math.random() * 1000);
  iframe.id = fid;
  document.write(iframe.outerHTML);
  var f = document.getElementById(fid);
  if(f) writeFrame(f);
}