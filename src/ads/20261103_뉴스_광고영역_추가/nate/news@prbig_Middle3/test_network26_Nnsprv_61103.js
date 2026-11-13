(function () {
    try {
        var _imgUrl = 'https://adimg.nate.com/img/2026/11/pc/pc_newspr_1105_970x420.png';
        var _title = '일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십';
        var _description = '일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십';
        var _linkUrl = '//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#';

        var _imgWidth = 970;
        var _imgHeight = 420;

        var _script = document.currentScript;
        var _adArea = _script && _script.parentNode;
        if (!_adArea || _adArea === document.head) return;

        var _wrapper = document.createElement('div');
        _wrapper.classList.add('pr-type-ad-wrapper');

        var _style = document.createElement('style');
        _style.textContent = `
            .pr-type-ad-wrapper {
                text-align: center;
                margin-top:-1px;
                background-color:#fff;
                padding-top:1px;
            }
            .pr-type-ad-wrapper .ad-link {
                width:${_imgWidth}px;
                height:${_imgHeight}px;
                display:block;
                text-decoration: none;
                border-radius:4px;
                position:relative;
                overflow:hidden;
            }
            .pr-type-ad-wrapper .ad-link:hover .ad-gradient::after {
                content:'';
                display:block;
                width:${_imgWidth}px;
                height:${_imgHeight}px;
                background-color:#286dea;
                opacity:0.25;
                position:absolute;
                top:0;
                left:0;
                border-radius:4px;
            }
            .pr-type-ad-wrapper .ad-link:hover .ad-title, .pr-type-ad-wrapper .ad-link:hover .ad-description {
                text-decoration:underline;
            }
            .pr-type-ad-wrapper .ad-link .ad-gradient {
                width:${_imgWidth}px;
                height:${_imgHeight}px;
                background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%);
                position:absolute;
                top:0;
                left:0;
                border-radius:4px;
            }
            .pr-type-ad-wrapper .ad-link .ad-img {
                width:${_imgWidth}px;
                height:${_imgHeight}px;
                box-sizing: border-box;
                position:relative;
            }
            .pr-type-ad-wrapper .ad-link .ad-img img{
                width: 100%;
            }
            .pr-type-ad-wrapper .ad-link .ad-mark {
                width:32px;
                font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Malgun Gothic, Arial, sans-serif;
                font-weight: 700;
                font-size: 14px;
                line-height: 20px;
                letter-spacing: -0.5px;
                text-align: center;
                display:inline-block;
                color: #FFFFFF80;
                border: 1px solid #FFFFFF33;
                border-radius: 150px;
                position:absolute;
                bottom:24px;
                right:24px;
            }
            .pr-type-ad-wrapper .ad-link .ad-text {
                display:flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
                width: 820px;
                min-width:0;
                position:absolute;
                left:24px;
                bottom:24px;
            }
            .pr-type-ad-wrapper .ad-link .ad-title {
                font-family: Malgun Gothic, "맑은고딕", -apple-system,BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Arial, sans-serif;
                font-weight: 500;
                font-size: 24px;
                line-height: 28px;
                letter-spacing: -1.4px;
                text-align: left;
                color:#fff;
                width: 100%;
                min-width: 0;
                max-width: 100%;
                box-sizing: border-box;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                padding-bottom: 12px;
            }
            .pr-type-ad-wrapper .ad-link .ad-description {
                font-family: Malgun Gothic, "맑은고딕", -apple-system,BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Arial, sans-serif;
                font-size: 15px;
                line-height: 22px;
                letter-spacing: -0.7px;
                text-align: left;
                color:#fff;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: break-all;
            }
        `;
        var _imgArea = document.createElement('div');
        _imgArea.classList.add('ad-img');
        var _img = document.createElement('img');
        _img.src = _imgUrl;
        _img.alt = 'ad';
        _img.width = _imgWidth;
        _img.height = _imgHeight;
        _imgArea.appendChild(_img);
        var _adMark = document.createElement('div');
        _adMark.classList.add('ad-mark');
        _adMark.textContent = 'AD';
        var _textArea = document.createElement('div');
        _textArea.classList.add('ad-text');
        var _titleArea = document.createElement('div');
        _titleArea.classList.add('ad-title');
        _titleArea.textContent = _title;
        var _descriptionArea = document.createElement('div');
        _descriptionArea.classList.add('ad-description');
        _descriptionArea.textContent = _description;    
        var _gradientArea = document.createElement('div');
        _gradientArea.classList.add('ad-gradient');
        var _adLink = document.createElement('a');
        _adLink.classList.add('ad-link');
        _adLink.href = _linkUrl;
        _adLink.target = '_blank';
        _adLink.appendChild(_imgArea);
        _adLink.appendChild(_gradientArea);
        _adLink.appendChild(_adMark);
        _adLink.appendChild(_textArea);
        _textArea.appendChild(_titleArea);
        _textArea.appendChild(_descriptionArea);
        _wrapper.appendChild(_adLink);
        _wrapper.appendChild(_style);
        _adArea.appendChild(_wrapper);
    } catch (e) {
      console.warn('[AD]', e);
    }
  })();
  