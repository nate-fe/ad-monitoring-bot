function httpRequest(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(JSON.parse(xhr.responseText));
        }
    };
    xhr.send();
}
var _scriptEl = document.currentScript;
var _adBig = _scriptEl.closest('.adloader');
var _css = `
    .naver_power_link .naver_power_link_title {padding:11px 15px 9px; font-size:17px; font-weight:600; line-height:19px; letter-spacing:-1px; color:#000; text-align:left; border-bottom:1px solid #ededed;  }
    .naver_power_link a, .naver_power_link a:hover, .naver_power_link a:focus {text-decoration:none; color:#0068C3;}
    .naver_power_link {height:360px; background-color:#fff; font-family: AppleSDGothicNeo-Regular, "Malgun Gothic", "맑은 고딕", helvetica,"Apple SD Gothic Neo",sans-serif;} 
    .naver_power_link .ad_comp {padding:13px 15px; text-align:left; position:relative; box-sizing:border-box; border-bottom:1px solid #DCDCDC; }
    .naver_power_link .ad_comp:last-child {border-bottom:none;}
    .naver_power_link .display_url {width:100%; display:flex; flex-direction:row; align-items:center; font-weight:500; margin-bottom:4px;}
    .naver_power_link .ad_comp.contains_img .contents {width:calc(100% - 116px);}
    .naver_power_link .display_url .ad_mark {text-align:center; border:1px solid #d9d9dc; margin-right:4px; background-color:#fff; font-size:10px; font-weight:600; display:inline-block; box-sizing:border-box; border-radius:10px; color:#7A7A7D; line-height:16px; padding:0 6px;}
    .naver_power_link .display_url .url > span {display:inline-block; margin-right:4px; vertical-align:0px; color:#949494; font-size:12px; letter-spacing:-0.5px; line-height:18px;}
    .naver_power_link .ad_comp.contains_img .display_url .url > span {max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .naver_power_link .display_url .ico_naver {margin-top:2px;}
    .naver_power_link .tit_area {margin-bottom:4px;}
    .naver_power_link .tit {width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; letter-spacing: -1px; font-size:17px; line-height:22px; font-weight:400; color:#004BCC; } 
    .naver_power_link .tit ~ .tit::before {display:inline-block; width:2px; height:2px; background-color:#0068C3; content:''; vertical-align:5px; margin:0 6px;}
    .naver_power_link .ad_comp.contains_tags .desc_area {height:40px;}
    .naver_power_link .desc_area, .naver_power_link .desc_area a {display:-webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp:3; overflow:hidden; text-overflow:ellipsis; font-size:15px; line-height:20px; letter-spacing:-1px; color:#222;} 
    .naver_power_link .ad_comp.contains_tags .desc_area, .naver_power_link .ad_comp.contains_tags .desc_area a, 
    .naver_power_link .ad_comp.contains_extension .desc_area, .naver_power_link .ad_comp.contains_extension .desc_area a {-webkit-line-clamp:2;}
    .naver_power_link .ad_comp.contains_img .desc_area {position:relative;}
    .naver_power_link .img_area {border:1px solid #ddd; position:absolute; right:15px; top:10px; z-index:2; width:104px; height:104px; overflow:hidden; border-radius:10px;}
    .naver_power_link .img_area img {width:100%; } 
    .naver_power_link .tag_area {overflow-x:auto; padding-top:28px; white-space: nowrap; scrollbar-width:none; -ms-overflow-style:none;}
    .naver_power_link .tag_area::-webkit-scrollbar {display:none;}
    .naver_power_link .tag_area .one_tag {display:inline-block; width:auto; font-size:15px; letter-spacing:-1px; line-height:34px; padding:0 12px; border:1px solid #E6E6E6; background-color:#fff; color:#004bcc; border-radius:32px; margin-right:4px;}
    .naver_power_link .tag_area .one_tag:last-child {margin-right:0;}
    .naver_power_link .extension_area {position:absolute; left:15px; bottom:23px; display:flex; flex-direction:row;}
    .naver_power_link .ad_comp.contains_extension.contains_tags .tag_area {padding-top:46px;}
    .naver_power_link .extension_area .extension_head, .naver_power_link .extension_area .extension_body {font-size:16px; letter-spacing:-1px; line-height:16px;}
    .naver_power_link .extension_area .extension_head {color:#00C717; margin-right:6px;}
    .naver_power_link .extension_area .extension_body {-webkit-line-clamp:1; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#222;}
    .naver_power_link .ad_comp.contains_extension.contains_tags .extension_area {bottom:60px;}
    @media (prefers-color-scheme : dark) {
        .naver_power_link {background-color:#262626; }
        .naver_power_link .naver_power_link_title {color:#fff; border-bottom-color:#424242; }
        .naver_power_link .ad_comp {border-color: #424242; }
        .naver_power_link .ad_comp:last-child {border:none; }
        .naver_power_link .display_url .ad_mark {border-color:#444; color:#949494; background-color:#262626; }
        .naver_power_link .tit {color:#5C8EE5;}
        .naver_power_link .desc_area, .naver_power_link .desc_area a {color:#D7D7D7;}
        .naver_power_link .img_area {border-color:#333;}
        .naver_power_link .tag_area .one_tag {background-color:#262626; color:#5C8EE5; border-color:#464646;}
        .naver_power_link .extension_area .extension_body {color:#d7d7d7;}
    }
`,
    _head = document.head || document.getElementsByTagName('head')[0],
    _style = document.createElement('style');
// 개발
// var endpoint = 'https://sandbox.impression-neo.naver.com';
// 라이브
var endpoint = 'https://external-api.impression-neo.naver.com';
var pageSize = 2;
var adHeight = 0;
var url = encodeURIComponent(window.location.href);
var userAgent = navigator.userAgent;
// 모바일네이트_공통
var keywordGroup = '%EB%AA%A8%EB%B0%94%EC%9D%BC%EB%84%A4%EC%9D%B4%ED%8A%B8_%EA%B3%B5%ED%86%B5';
_head.appendChild(_style);
_style.type = 'text/css';
if (_style.styleSheet){ _style.styleSheet.cssText = _css; } else {  _style.appendChild(document.createTextNode(_css));}
function loadData() {
    httpRequest(endpoint + '/api/v2/ads/search?channel=m_nate.ch3&pageSize='+ pageSize +'&pageNo=1&query=&url='+ url +'&userAgent='+ userAgent +'&keywordGroup=' + keywordGroup, function(data){
        var ads = data.ads;
        var _naverPowerLink = document.createElement('div');
        _naverPowerLink.classList.add('naver_power_link')
        if (ads) {
            var _title = document.createElement('div');
            _title.classList.add('naver_power_link_title');
            _title.innerText = '파워링크'
            _naverPowerLink.appendChild(_title);
            for (var i = 0; i < ads.length; i++) {
                var el = ads[i];
                var _comp = document.createElement('div');
                var _contents = document.createElement('div');
                // 이미지 + 광고 설명
                var _desc = document.createElement('div');   
                _contents.classList.add('contents');
                _comp.classList.add('ad_comp');   

                // 광고 표시 url
                if (el.displayUrl) {                    
                    // 광고 표시되는 url
                    var _row = document.createElement('div');
                    // display url span
                    var _dUrlSpan = document.createElement('span');
                    var _dUrl = document.createElement('a');
                    _dUrlSpan.textContent = el.displayUrl.split('//')[1];
                    _dUrl.href = el.displayUrl;
                    _dUrl.title = 'URL';
                    _dUrl.classList.add('url');
                    _dUrl.target = '_blank';
                    _row.classList.add('display_url');
                    _dUrl.appendChild(_dUrlSpan);
                    _row.appendChild(_dUrl);
                    _contents.appendChild(_row);        
                    // 네이버 페이 아이콘
                    if (el.naverPayIconType) {
                        if (el.naverPayIconType === 0) { }
                        // 결제형 아이콘(페이 아이콘)
                        else if (el.naverPayIconType === 1) {
                            var _img = document.createElement('img');
                            _img.src = 'https://adimg.nate.com/img/2025/04/naver/naver_a_0514.svg';
                            _img.title = '네이버 페이 아이콘';
                            _img.classList.add('ico_naver')
                            _row.appendChild(_img);
                        }
                        // 주문형 아이콘(페이플러스 아이콘)
                        else {
                            var _img = document.createElement('img');
                            _img.src = 'https://adimg.nate.com/img/2025/04/naver/naver_b_0514.svg';
                            _img.title = '네이버 페이 플러스 아이콘';
                            _img.classList.add('ico_naver')
                            _row.appendChild(_img);
                        }
                    }
                    // 네이버 아이디로 로그인
                    else if (el.isNaverLoginIconEnabled) {
                        var _img = document.createElement('img');
                        _img.src = 'https://adimg.nate.com/img/2025/04/naver/naver_d_0514.svg';
                        _img.title = '네이버 아이디로 로그인 아이콘'
                        _img.classList.add('ico_naver')
                        _row.appendChild(_img);
                    }
                    // 네이버 톡톡 아이콘 
                    else if (el.isTalkTalkIconEnabled) {
                        var _img = document.createElement('img');
                        _img.src = 'https://adimg.nate.com/img/2025/04/naver/naver_c_0514.svg';
                        _img.title = '네이버 톡톡 아이콘'
                        _img.classList.add('ico_naver')
                        _row.appendChild(_img);
                    } 
                    // 아무것도 없을 때 광고 아이콘
                    else {
                        // 광고 문구
                        // var _adSpan = document.createElement('span');    
                        // _adSpan.textContent = '광고';
                        // _adSpan.classList.add('ad_mark')
                        // _row.appendChild(_adSpan);
                    }
                }
                // 제목
                if (el.headline) {
                    var _tit = document.createElement('div');
                    var _sOfTit = document.createElement('div');
                    var _div = document.createElement('div');
                    _tit.textContent = el.headline;
                    _tit.classList.add('tit');
                    _sOfTit.appendChild(_tit);
                    _div.classList.add('tit_area');
                    // 클릭
                    if (el.clickUrl) {
                        var _li = document.createElement('a');
                        _li.href = el.clickUrl;
                        _li.title = el.headline;
                        _li.target = '_blank';
                        _li.appendChild(_sOfTit);
                        _div.appendChild(_li);
                    } else {
                        _div.appendChild(_sOfTit)
                    } _contents.appendChild(_div);
                }
                // 이미지
                if (el.imageExtension && el.imageExtension.length !== 0) {
                    var _aOfImg = document.createElement('a');
                    _aOfImg.href = el.imageExtension.clickUrl;
                    _aOfImg.title = el.headline;
                    _aOfImg.classList.add('img_area')
                    _aOfImg.style.background = 'url(' + el.imageExtension.imageUrl + ') no-repeat center center';
                    _aOfImg.style.backgroundSize = '100%';
                    _aOfImg.target = '_blank';
                    _comp.classList.add('contains_img')
                    _contents.appendChild(_aOfImg);
                }
                // 광고 설명
                if (el.description) {
                    _desc.classList.add('desc_area');
                    var _aOfDescNoLink = document.createElement('a');
                    _aOfDescNoLink.href = el.clickUrl;
                    _aOfDescNoLink.title = el.headline;
                    _aOfDescNoLink.target = '_blank';
                    _aOfDescNoLink.textContent = el.description;
                    _desc.appendChild(_aOfDescNoLink); 
                    _contents.appendChild(_desc); 
                }                
                // 홍보문구 확장 설명
                if (el.descriptionExtension) {
                    var _divOfDE = document.createElement('div');
                    _divOfDE.classList.add('extension_area')
                    _comp.classList.add('contains_extension')
                    if (el.descriptionExtension.heading) {
                        var _spanOfHead = document.createElement('span');
                        _spanOfHead.textContent = el.descriptionExtension.heading;
                        _spanOfHead.classList.add('extension_head')
                        _divOfDE.appendChild(_spanOfHead)
                    }
                    var _aOfDesc= document.createElement('a');
                    _aOfDesc.href = el.descriptionExtension.clickUrl;
                    _aOfDesc.title = el.descriptionExtension.description;
                    _aOfDesc.textContent =el.descriptionExtension.description;
                    _aOfDesc.target = '_blank';
                    _aOfDesc.classList.add('extension_body')
                    _divOfDE.appendChild(_aOfDesc)
                    _contents.appendChild(_divOfDE); 
                }
                _comp.appendChild(_contents);
                // 원형 태그
                if (el.subLinkExtension && el.subLinkExtension.length !== 0) {
                    var _divOfTags = document.createElement('div');
                    _divOfTags.classList.add('tag_area');
                    _comp.classList.add('contains_tags');
                    for (var j = 0; j < el.subLinkExtension.length; j++) {
                        var _tag = el.subLinkExtension[j];
                        var _aOfTag = document.createElement('a');
                        _aOfTag.href = _tag.clickUrl;
                        _aOfTag.textContent = _tag.name;
                        _aOfTag.target = '_blank';
                        _aOfTag.classList.add('one_tag');
                        _divOfTags.appendChild(_aOfTag);
                    } 
                    _comp.appendChild(_divOfTags); 
                    if (el.descriptionExtension && el.descriptionExtension.description !== '') {
                        _comp.style.height = 200 + 'px';
                        adHeight = adHeight + 200;
                    } else {
                        _comp.style.height = 180 + 'px';
                        adHeight = adHeight + 180;
                    }
                } else {
                    if (el.descriptionExtension && el.descriptionExtension.description !== '') {
                        _comp.style.height = 180 + 'px';
                        adHeight = adHeight + 180;
                    } else if (el.imageExtension) {
                        _comp.style.height = 140 + 'px';
                        adHeight = adHeight + 140;
                    } else {
                        _comp.style.height = 120 + 'px';
                        adHeight = adHeight + 120;
                    }
                }
                _naverPowerLink.appendChild(_comp); 
                _naverPowerLink.style.height = adHeight + 40 + 'px';
            }
        } 
            _adBig.appendChild(_naverPowerLink);
    })
}
if (_scriptEl) {
    if (_adBig) {
        loadData(); 
    } else {
        console.log('Naver Powerlink Error.')
    }
}