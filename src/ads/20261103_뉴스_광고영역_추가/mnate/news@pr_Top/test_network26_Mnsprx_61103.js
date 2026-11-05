(function () {
    try {
        var _title = 'news area ad lorem ipsum dolor sit amet sdlfk sdlkfjlk sdjl kfsdljkf jlsdkf jlsdkjf lskdj lksdjfl ksdjl kdsjlf kjsldkjflskdjfl ksdjlkfjl sdkjf';
        var _linkUrl = '//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#';

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
                width: 100%;
                box-sizing: border-box;
                position:relative;
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
                border: 1px solid #99999980;
                color:  #999;
                border-radius: 150px;
                position:absolute;
                top:3px;
                left:0;
            }
            .pr-type-ad-wrapper .ad-link .ad-text {
                display:flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
                width: 100%;
                min-width: 0;
                overflow: hidden;
            }
            .pr-type-ad-wrapper .ad-link .ad-title {
                font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Malgun Gothic, Arial, sans-serif;
                font-weight: 500;
                font-size: 17px;
                line-height: 22px;
                letter-spacing: -1px;
                text-align: left;
                color:#222;
                width: 100%;
                min-width: 0;
                max-width: 100%;
                box-sizing: border-box;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                padding-left: 31px;
            }
            @media (prefers-color-scheme: dark) {
                .pr-type-ad-wrapper {
                    border-top:1px solid #393939;
                }
                .pr-type-ad-wrapper .ad-link .ad-title {
                    color: #d7d7d7;
                }
            }
        `;
        var _adMark = document.createElement('div');
        _adMark.classList.add('ad-mark');
        _adMark.textContent = 'AD';
        var _textArea = document.createElement('div');
        _textArea.classList.add('ad-text');
        var _titleArea = document.createElement('div');
        _titleArea.classList.add('ad-title');
        _titleArea.textContent = _title;
        var _adLink = document.createElement('a');
        _adLink.classList.add('ad-link');
        _adLink.href = _linkUrl;
        _adLink.target = '_blank';
        _adLink.appendChild(_adMark);
        _textArea.appendChild(_titleArea);
        _adLink.appendChild(_textArea);
        _wrapper.appendChild(_adLink);
        _wrapper.appendChild(_style);
        _adArea.appendChild(_wrapper);
    } catch (e) {
      console.warn('[AD]', e);
    }
  })();
  