window.onload = function(){
    try {  
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
    var _css = `
        body, html {margin:0; padding:0;} 
        body, div, a, span {font-family: AppleSDGothicNeo-Regular, "Malgun Gothic", "맑은 고딕", helvetica,"Apple SD Gothic Neo",sans-serif;}
        a, a:hover, a:focus {text-decoration:none; color:#0068C3;}
        .naver_power_link {height:360px; background-color:#fff;} 
        .naver_power_link .ad_comp {padding:13px 15px; text-align:left; position:relative; box-sizing:border-box; }
        .naver_power_link .ad_comp:first-child {border-bottom:1px solid #DCDCDC; }
        .naver_power_link .display_url {width:100%; overflow:hidden; text-overflow:ellipsis; white-space: nowrap; font-weight:500; line-height:18px; margin-bottom:4px;}
        .naver_power_link .display_url .ad_mark {text-align:center; border:1px solid #d9d9dc; background-color:#fff; font-size:10px; font-weight:600; display:inline-block; box-sizing:border-box; border-radius:10px; color:#7A7A7D; line-height:16px; padding:0 6px;}
        .naver_power_link .display_url .url {width:auto; display:inline-block; margin-right:4px; vertical-align:0px; color:#949494; font-size:12px; letter-spacing:-0.5px; line-height:18px;}
        .naver_power_link .tit_area {margin-bottom:2px;}
        .naver_power_link .tit {width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; letter-spacing: -1px; font-size:17px; line-height:22px; font-weight:400; color:#004BCC; } 
        .naver_power_link .tit ~ .tit::before {display:inline-block; width:2px; height:2px; background-color:#0068C3; content:''; vertical-align:5px; margin:0 6px;}
        .naver_power_link .ad_comp.contains_tags .desc_area {height:40px;}
        .naver_power_link .desc_area, .naver_power_link .desc_area a {display:-webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp:3; overflow:hidden; text-overflow:ellipsis; font-size:15px; line-height:20px; letter-spacing:-1px; color:#222;} 
        .naver_power_link .ad_comp.contains_tags .desc_area, .naver_power_link .ad_comp.contains_tags .desc_area a {-webkit-line-clamp:2;}
        .naver_power_link .ad_comp.contains_img .desc_area {padding-right:118px; position:relative;}
        .naver_power_link .img_area {border:1px solid #ddd; position:absolute; right:15px; top:10px; z-index:2; width:104px; height:104px; overflow:hidden; border-radius:10px;}
        .naver_power_link .img_area img {width:100%; } 
        .naver_power_link .tag_area {overflow-x:auto; padding-top:28px; white-space: nowrap; scrollbar-width:none; -ms-overflow-style:none;}
        .naver_power_link .tag_area::-webkit-scrollbar {display:none;}
        .naver_power_link .tag_area .tag {display:inline-block; width:auto; line-height:34px; padding:0 12px; border:1px solid #E6E6E6; background-color:#fff; color:#004bcc; border-radius:32px; margin-right:4px;}
        .naver_power_link .tag_area .tag:last-child {margin-right:0;}
        @media (prefers-color-scheme : dark) {
            .naver_power_link {background-color:#262626;}
            .naver_power_link .ad_comp:first-child {border-color: #424242; }
            .naver_power_link .display_url .ad_mark {border-color:#444; color:#949494; background-color:#262626; }
            .naver_power_link .tit {color:#5C8EE5;}
            .naver_power_link .desc_area, .naver_power_link .desc_area a {color:#D7D7D7;}
            .naver_power_link .img_area {border-color:#333;}
            .naver_power_link .tag_area .tag {background-color:#262626; color:#5C8EE5; border-color:#464646;}
        }
    `,
        _head = document.head || document.getElementsByTagName('head')[0],
        _style = document.createElement('style');
    var title = document.title;
    var mainBanner = document.getElementById('main_banner');
    // 개발
    var endpoint = 'https://sandbox.impression-neo.naver.com';
    // 라이브
    // var endpoint = 'https://external-api.impression-neo.naver.com';
    var pageSize = 2;
    // height
    var adHeight = 0;
    var url = encodeURIComponent(window.parent.location.href);
    var userAgent = navigator.userAgent;
    // 모바일네이트_공통
    var keywordGroup = '%EB%AA%A8%EB%B0%94%EC%9D%BC%EB%84%A4%EC%9D%B4%ED%8A%B8_%EA%B3%B5%ED%86%B5';
    _head.appendChild(_style);
    _style.type = 'text/css';
    if (_style.styleSheet){
          _style.styleSheet.cssText = _css;
      } else {
          _style.appendChild(document.createTextNode(_css));
      }
    function loadData() {
        httpRequest(endpoint + '/api/v2/ads/search?channel=m_nate.ch2&pageSize='+ pageSize +'&pageNo=1&query=&url='+ url +'&userAgent='+ userAgent +'&keywordGroup=' + keywordGroup, function(data){
            var ads = data.ads;
            var _naverPowerLink = document.createElement('div');
            _naverPowerLink.classList.add('naver_power_link')
            if (ads) {
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
                        // 광고 문구
                        var _adSpan = document.createElement('span');                        
                        // 광고 표시되는 url
                        var _row = document.createElement('div');
                        // display url span
                        var _displayUrlSpan = document.createElement('span');
                        var _displayUrl = document.createElement('a');
                        _adSpan.textContent = title.split(' ')[0];
                        _adSpan.classList.add('ad_mark')
                        _displayUrlSpan.textContent = el.displayUrl;
                        _displayUrl.href = el.displayUrl;
                        _displayUrl.title = 'URL';
                        _displayUrl.classList.add('url');
                        _displayUrl.target = '_blank';
                        _row.classList.add('display_url');
                        _displayUrl.appendChild(_displayUrlSpan);
                        _row.appendChild(_displayUrl);
                        _row.appendChild(_adSpan);
                        _contents.appendChild(_row);                             
                    }
                    // 제목
                    if (el.headline) {
                        var _tit = document.createElement('div');
                        var _spanOfTit = document.createElement('div');
                        var _div = document.createElement('div');
                        _tit.textContent = el.headline;
                        _tit.classList.add('tit');
                        _spanOfTit.appendChild(_tit);
                        _div.classList.add('tit_area');
                        // 클릭
                        if (el.clickUrl) {
                            var _link = document.createElement('a');
                            _link.href = el.clickUrl;
                            _link.title = el.headline;
                            _link.target = '_blank';
                            _link.appendChild(_spanOfTit);
                            _div.appendChild(_link);
                        } else {
                            _div.appendChild(_spanOfTit)
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
                        // 확장 설명
                        if (el.descriptionExtension) {
                            var _aOfDescription = document.createElement('a');
                            _aOfDescription.href = el.descriptionExtension.clickUrl;
                            _aOfDescription.title = el.descriptionExtension.description;
                            _aOfDescription.textContent = el.description;
                            _aOfDescription.target = '_blank';
                            _desc.appendChild(_aOfDescription); 
                        } else {
                            var _aOfDescriptionNoLink = document.createElement('a');
                            _aOfDescriptionNoLink.href = el.clickUrl;
                            _aOfDescriptionNoLink.title = el.headline;
                            _aOfDescriptionNoLink.target = '_blank';
                            _aOfDescriptionNoLink.textContent = el.description;
                            _desc.appendChild(_aOfDescriptionNoLink); 
                        } 
                        _contents.appendChild(_desc); 
                        _comp.appendChild(_contents);
                    }
                        
                    if (el.imageExtension) {
                        _comp.style.height = 140 + 'px';
                        adHeight = adHeight + 140;
                    } else {
                        _comp.style.height = 120 + 'px';
                        adHeight = adHeight + 120;
                    }
                    _naverPowerLink.appendChild(_comp);
                    _naverPowerLink.style.height = adHeight + 'px';
                }
            }
            mainBanner.appendChild(_naverPowerLink)
            var isHIssue = location.href.indexOf('Hissue') > -1;
            var isIssuepick = location.href.indexOf('Issuepick') > -1;
            var _parentId = '';
            if (isHIssue) {
                _parentId = 'hissue';
            }
            if (isIssuepick) {
                _parentId = 'issuepick'
            }
            window.parent.document.querySelector('#ad_' + _parentId + '_middle_banner').style.height = adHeight + 'px';
        })
    }
    loadData();
} catch(e) {} 
}