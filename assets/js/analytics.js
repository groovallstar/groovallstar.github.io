;(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var endpoint = script.dataset.goatcounterEndpoint;
  var productionHost = script.dataset.goatcounterHost;
  if (!endpoint || !productionHost || window.location.hostname !== productionHost) return;

  function parameter(name, value) {
    return name + '=' + encodeURIComponent(value);
  }

  function send(path, title, event, noSession) {
    var query = [parameter('p', path), parameter('t', title)];
    if (event) query.push('e=1');
    if (noSession) query.push('ns=1');

    try {
      window.fetch(endpoint + '?' + query.join('&'), {
        method: 'POST',
        mode: 'no-cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        keepalive: true
      }).catch(function () {});
    } catch (_error) {
      // Analytics failures must never affect rendering or navigation.
    }
  }

  function bindClickEvents() {
    var links = document.querySelectorAll('[data-goatcounter-click]');
    Array.prototype.forEach.call(links, function (link) {
      var countClick = function () {
        send(
          link.dataset.goatcounterClick,
          link.dataset.goatcounterTitle || '',
          true,
          link.dataset.goatcounterNoSession === '1'
        );
      };
      link.addEventListener('click', countClick, false);
      link.addEventListener('auxclick', countClick, false);
    });
  }

  function start() {
    send(window.location.pathname, document.title, false, false);
    bindClickEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
