(function () {
    try {
        var _imgUrl = 'https://adimg.nate.com/img/2026/11/pc/pc_newspr_1105_180x126.png';
        var _title = '일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십';
        var _description = '일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십';
        var _linkUrl = '//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#';

        var _imgWidth = 180;
        var _imgHeight = 126;

        var _script = document.currentScript;
        var _adArea = _script && _script.parentNode;
        if (!_adArea || _adArea === document.head) return;

        var _wrapper = document.createElement('div');
        _wrapper.classList.add('pr-type-thumbnail-ad-wrapper');

        var _style = document.createElement('style');
        _style.textContent = `
            .pr-type-thumbnail-ad-wrapper {
                text-align: center;
                border-bottom:1px solid #222;
            }
            .pr-type-thumbnail-ad-wrapper .ad-link {
                padding:30px 20px 30px 0;
                display:flex;
                flex-direction: row;
                text-decoration: none;
                border-radius:4px;
                position:relative;
                overflow:hidden;
            }
            .pr-type-thumbnail-ad-wrapper .ad-link:hover .ad-img::before {
                display:block;
                content:'';
                width:${_imgWidth}px;
                height:${_imgHeight}px;
                background-color:#286dea;
                opacity:0.25;
                position:absolute;
                left:0;
                top:0;
            }
            .pr-type-thumbnail-ad-wrapper .ad-link:hover .ad-title, .pr-type-thumbnail-ad-wrapper .ad-link:hover .ad-description {
                text-decoration:underline;
            }
            .pr-type-thumbnail-ad-wrapper .ad-link .ad-img {
                width:${_imgWidth}px;
                height:${_imgHeight}px;
                box-sizing: border-box;
                position:relative;
                border:1px solid rgba(0,0,0,0.05);
            }
            .pr-type-thumbnail-ad-wrapper .ad-link .ad-img img{
                width: 100%;
            }
            .pr-type-thumbnail-ad-wrapper .ad-link .ad-mark {
                width:24px;
                font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Malgun Gothic, Arial, sans-serif;
                font-weight: 700;
                font-size: 12px;
                line-height: 17px;
                letter-spacing: -0.5px;
                text-align: center;
                display:inline-block;
                background-color: #00000033;
                color: #FFFFFF80;
                position:absolute;
                top:0px;
                right:0;
            }
            .pr-type-thumbnail-ad-wrapper .ad-link .ad-text {
                display:flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
                width: 750px;
                min-width:0;
                padding-left:20px; 
            }
            .pr-type-thumbnail-ad-wrapper .ad-link .ad-title {
                font-family: Malgun Gothic, "맑은고딕", -apple-system,BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Arial, sans-serif;
                font-weight: 500;
                font-size: 18px;
                line-height: 28px;
                letter-spacing: -1.4px;
                text-align: left;
                color:#000;
                width: 100%;
                min-width: 0;
                max-width: 100%;
                box-sizing: border-box;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                padding-bottom: 12px;
            }
            .pr-type-thumbnail-ad-wrapper .ad-link .ad-description {
                font-family: Malgun Gothic, "맑은고딕", -apple-system,BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Arial, sans-serif;
                font-size: 16px;
                line-height: 22px;
                letter-spacing: -0.7px;
                text-align: left;
                color:#878787;
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
        _imgArea.appendChild(_adMark);
        var _textArea = document.createElement('div');
        _textArea.classList.add('ad-text');
        var _titleArea = document.createElement('div');
        _titleArea.classList.add('ad-title');
        _titleArea.textContent = _title;
        var _descriptionArea = document.createElement('div');
        _descriptionArea.classList.add('ad-description');
        _descriptionArea.textContent = _description;
        var _adLink = document.createElement('a');
        _adLink.classList.add('ad-link');
        _adLink.href = _linkUrl;
        _adLink.target = '_blank';
        _adLink.appendChild(_imgArea);
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
  