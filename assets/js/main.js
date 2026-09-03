(function () {
  'use strict';

  // 테마 토글 — 선택값은 localStorage 에 남기고, 없으면 OS 설정을 따른다
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('pref-theme', isDark ? 'dark' : 'light');
    });
  }

  // 목차 — 본문의 h2/h3 로 만든다. 항목이 없으면 상자를 감춘 채로 둔다.
  var toc = document.getElementById('toc');
  var content = document.querySelector('.post-content');
  if (toc && content) {
    var headings = content.querySelectorAll('h2[id], h3[id]');
    if (headings.length > 1) {
      var root = document.createElement('ul');
      var sub = null;

      headings.forEach(function (h) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);

        if (h.tagName === 'H2') {
          root.appendChild(li);
          sub = null;
        } else {
          if (!sub) {
            sub = document.createElement('ul');
            (root.lastElementChild || root).appendChild(sub);
          }
          sub.appendChild(li);
        }
      });

      toc.querySelector('.inner').appendChild(root);
      toc.removeAttribute('hidden');
    }
  }

  // 스크롤을 내리면 '맨 위로' 버튼을 띄운다
  var topLink = document.getElementById('top-link');
  if (topLink) {
    var onScroll = function () {
      topLink.classList.toggle('visible', window.scrollY > 800);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
