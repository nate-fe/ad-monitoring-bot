(function () {
    try {
        var _imgUrl = '%#img_path%#';
        var _title = 'news area ad lorem ipsum dolor sit amet sdlfk sdlkfjlk sdjl kfsdljkf jlsdkf jlsdkjf lskdj lksdjfl ksdjl kdsjlf kjsldkjflskdjfl ksdjlkfjl sdkjf';
        var _description = 'news area ad lorem ipsum dolor sit amet sdlfk sdlkfjlk sdjl kfsdljkf jlsdkf jlsdkjf lskdj lksdjfl ksdjl kdsjlf kjsldkjflskdjfl ksdjlkfjl sdkjf';
        var _linkUrl = '//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#';

        var _imgWidth = 110;
        var _imgHeight = 84;

        var _script = document.currentScript;
        var _adArea = _script && _script.parentNode;
        if (!_adArea || _adArea === document.head) return;

        var _wrapper = document.createElement('div');
        _wrapper.classList.add('pr-type-ad-wrapper');

        var _style = document.createElement('style');
        _style.textContent = `
            .pr-type-ad-wrapper {
                text-align: center;
                display: flex;
                padding:20px 13px;
                border-top:1px solid #e6e6e6;
            }
            .pr-type-ad-wrapper .ad-link {
                display:flex;
                flex-direction: row;
                text-decoration: none;
            }
            .pr-type-ad-wrapper .ad-link .ad-img {
                width: ${_imgWidth}px;
                height: ${_imgHeight}px;
                box-sizing: border-box;
                border: 1px solid rgba(0, 0, 0, 0.05);
                position:relative;
            }
            .pr-type-ad-wrapper .ad-link .ad-img img{
                width: 100%;
            }
            .pr-type-ad-wrapper .ad-link .ad-mark {
                width:24px;
                font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Malgun Gothic, Arial, sans-serif;
                font-weight: 700;
                font-size: 12px;
                line-height: 17px;
                letter-spacing: -0.5px;
                text-align: center;
                display:inline-block;
                background: #00000026;
                color:  #FFFFFF80;
                position:absolute;
                top:0;
                right:0;
            }
            .pr-type-ad-wrapper .ad-link .ad-text {
                display:flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
                padding-left: 12px;
                flex:1;
            }
            .pr-type-ad-wrapper .ad-link .ad-title {
                font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Malgun Gothic, Arial, sans-serif;
                font-weight: 500;
                font-size: 17px;
                line-height: 22px;
                letter-spacing: -1px;
                text-align: left;
                color:#222;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: break-all;
            }
            .pr-type-ad-wrapper .ad-link .ad-description {
                font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Malgun Gothic, Arial, sans-serif;
                font-size: 15px;
                line-height: 18px;
                letter-spacing: -1px;
                text-align: left;
                color:#777;
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: break-all;
            }
            @media (prefers-color-scheme: dark) {
                .pr-type-ad-wrapper {
                    border-top:1px solid #393939;
                }
                .pr-type-ad-wrapper .ad-link .ad-img {
                    border: none;
                }
                .pr-type-ad-wrapper .ad-link .ad-title {
                    color: #d7d7d7;
                }
                .pr-type-ad-wrapper .ad-link .ad-description {
                    color: #8e8e8e;
                }
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
        _textArea.appendChild(_titleArea);
        _textArea.appendChild(_descriptionArea);
        _adLink.appendChild(_textArea);
        _wrapper.appendChild(_adLink);
        _wrapper.appendChild(_style);
        _adArea.appendChild(_wrapper);
    } catch (e) {
      console.warn('[AD]', e);
    }
  })();
  