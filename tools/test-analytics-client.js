'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/analytics.js', 'utf8');

function executeClient(options = {}) {
  const requests = [];
  const forbiddenReads = [];
  const handlers = {};
  const documentHandlers = {};
  const link = {
    dataset: {
      goatcounterClick: 'post-click/posts/ai-era-expertise/',
      goatcounterTitle: 'AI 시대, 전문성은 사라지는가',
      goatcounterNoSession: '1'
    },
    addEventListener(type, handler) {
      handlers[type] = handler;
    }
  };
  const location = new Proxy({
    hostname: options.hostname || 'groovallstar.github.io',
    pathname: '/posts/private/'
  }, {
    get(target, property) {
      if (property === 'search') forbiddenReads.push('location.search');
      return property === 'search' ? '?private=value' : target[property];
    }
  });
  const document = {
    currentScript: {
      dataset: {
        goatcounterEndpoint: options.endpoint === undefined
          ? 'https://marrh.goatcounter.com/count'
          : options.endpoint,
        goatcounterHost: options.host === undefined
          ? 'groovallstar.github.io'
          : options.host
      }
    },
    readyState: options.readyState || 'complete',
    title: 'Private query page',
    querySelectorAll(selector) {
      assert.equal(selector, '[data-goatcounter-click]');
      return [link];
    },
    addEventListener(type, handler) {
      documentHandlers[type] = handler;
    }
  };
  Object.defineProperty(document, 'referrer', {
    get() {
      forbiddenReads.push('document.referrer');
      return 'https://sensitive.example/source';
    }
  });
  const window = {
    location,
    fetch(url, fetchOptions) {
      requests.push({ url, options: { ...fetchOptions } });
      if (options.fetchThrows) throw new Error('blocked analytics request');
      return Promise.resolve();
    }
  };
  const screen = new Proxy({ width: 1920 }, {
    get(target, property) {
      forbiddenReads.push(`screen.${String(property)}`);
      return target[property];
    }
  });
  Object.defineProperty(window, 'screen', {
    get() {
      forbiddenReads.push('window.screen');
      return screen;
    }
  });

  vm.runInNewContext(source, {
    document,
    encodeURIComponent,
    location,
    Promise,
    screen,
    window
  });

  return { documentHandlers, forbiddenReads, handlers, requests };
}

const active = executeClient();
assert.deepEqual(active.forbiddenReads, []);
assert.deepEqual(active.documentHandlers, {});
assert.equal(active.requests.length, 1);
assert.equal(
  active.requests[0].url,
  'https://marrh.goatcounter.com/count?p=%2Fposts%2Fprivate%2F&t=Private%20query%20page'
);
assert.deepEqual(active.requests[0].options, {
  method: 'POST',
  mode: 'no-cors',
  credentials: 'omit',
  referrerPolicy: 'no-referrer',
  keepalive: true
});
assert.equal(typeof active.handlers.click, 'function');
assert.equal(typeof active.handlers.auxclick, 'function');

let prevented = false;
const clickEvent = {
  preventDefault() {
    prevented = true;
  }
};
active.handlers.click(clickEvent);
active.handlers.click(clickEvent);
assert.equal(prevented, false);
assert.equal(active.requests.length, 3);
assert.equal(
  active.requests[1].url,
  'https://marrh.goatcounter.com/count?p=post-click%2Fposts%2Fai-era-expertise%2F&t=AI%20%EC%8B%9C%EB%8C%80%2C%20%EC%A0%84%EB%AC%B8%EC%84%B1%EC%9D%80%20%EC%82%AC%EB%9D%BC%EC%A7%80%EB%8A%94%EA%B0%80&e=1&ns=1'
);
assert.equal(active.requests[2].url, active.requests[1].url);
assert.deepEqual(active.forbiddenReads, []);

const wrongHost = executeClient({ hostname: 'localhost' });
assert.equal(wrongHost.requests.length, 0);
assert.deepEqual(wrongHost.handlers, {});

const missingEndpoint = executeClient({ endpoint: '' });
assert.equal(missingEndpoint.requests.length, 0);
assert.deepEqual(missingEndpoint.handlers, {});

const missingHost = executeClient({ host: '' });
assert.equal(missingHost.requests.length, 0);
assert.deepEqual(missingHost.handlers, {});

const loading = executeClient({ readyState: 'loading' });
assert.equal(loading.requests.length, 0);
assert.deepEqual(loading.handlers, {});
assert.equal(typeof loading.documentHandlers.DOMContentLoaded, 'function');
loading.documentHandlers.DOMContentLoaded();
assert.equal(loading.requests.length, 1);
assert.equal(typeof loading.handlers.click, 'function');

const blocked = executeClient({ fetchThrows: true });
assert.equal(typeof blocked.handlers.click, 'function');
assert.doesNotThrow(() => blocked.handlers.click(clickEvent));

console.log('Analytics client behavior passed.');
