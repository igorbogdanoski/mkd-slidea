/**
 * MKD Slidea — Embed Loader (Sprint 5.2)
 *
 * Drop-in script for blog/CMS/WordPress integration.
 *
 * Usage:
 *   <div data-mkd-slidea="EVENTCODE" data-height="480"></div>
 *   <script async src="https://slidea.mismath.net/embed.js"></script>
 *
 * Optional data-* attributes:
 *   data-height   — initial iframe height in pixels (default 480)
 *   data-radius   — border radius (default 16)
 *   data-shadow   — "true" to apply soft shadow (default true)
 *   data-utm      — UTM source override (default "embed")
 *
 * Auto-resizes via postMessage("mkd-slidea-resize") from the embed page.
 * Safe to load multiple times — guards against double execution.
 */
(function () {
  if (window.__mkdSlideaEmbedLoaded) return;
  window.__mkdSlideaEmbedLoaded = true;

  var ORIGIN = (function () {
    try {
      var s = document.currentScript;
      if (s && s.src) return new URL(s.src).origin;
    } catch (e) { /* ignore */ }
    return 'https://slidea.mismath.net';
  })();

  function bool(v, dflt) {
    if (v == null) return dflt;
    var s = String(v).toLowerCase();
    return !(s === 'false' || s === '0' || s === 'no');
  }

  function buildIframe(node) {
    var raw = node.getAttribute('data-mkd-slidea') || node.getAttribute('data-event') || '';
    var code = String(raw).replace(/^#/, '').trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(code)) {
      node.innerHTML = '<p style="font:700 13px system-ui;color:#94a3b8;padding:16px;border:2px dashed #e2e8f0;border-radius:12px;text-align:center">MKD Slidea: невалиден код на настан.</p>';
      return null;
    }

    var height = parseInt(node.getAttribute('data-height') || '480', 10);
    if (!isFinite(height) || height < 120) height = 480;
    var radius = parseInt(node.getAttribute('data-radius') || '16', 10);
    var shadow = bool(node.getAttribute('data-shadow'), true);
    var utm = encodeURIComponent(node.getAttribute('data-utm') || 'embed');

    var iframe = document.createElement('iframe');
    iframe.src = ORIGIN + '/event/' + code + '/embed?utm_source=' + utm + '&utm_medium=widget';
    iframe.title = 'MKD Slidea — ' + code;
    iframe.loading = 'lazy';
    iframe.allow = 'clipboard-write';
    iframe.setAttribute('frameborder', '0');
    iframe.style.width = '100%';
    iframe.style.minHeight = height + 'px';
    iframe.style.height = height + 'px';
    iframe.style.border = '0';
    iframe.style.borderRadius = (isFinite(radius) ? radius : 16) + 'px';
    iframe.style.background = '#ffffff';
    iframe.style.display = 'block';
    if (shadow) iframe.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)';

    node.innerHTML = '';
    node.appendChild(iframe);
    node.setAttribute('data-mkd-mounted', '1');
    return iframe;
  }

  function mountAll() {
    var nodes = document.querySelectorAll('[data-mkd-slidea]:not([data-mkd-mounted="1"])');
    var frames = [];
    for (var i = 0; i < nodes.length; i++) {
      var iframe = buildIframe(nodes[i]);
      if (iframe) frames.push(iframe);
    }
    return frames;
  }

  // Listen for resize requests from any embedded MKD Slidea iframe.
  window.addEventListener('message', function (e) {
    var data = e && e.data;
    if (!data || data.type !== 'mkd-slidea-resize') return;
    var height = parseInt(data.height, 10);
    if (!isFinite(height) || height < 80) return;
    // Match the iframe by source window.
    var iframes = document.querySelectorAll('iframe[src*="/embed"]');
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow === e.source) {
        iframes[i].style.height = height + 'px';
        iframes[i].style.minHeight = height + 'px';
        return;
      }
    }
  }, false);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll, { once: true });
  } else {
    mountAll();
  }

  // Public API for SPAs / CMS that mount nodes after initial load.
  window.MKDSlidea = window.MKDSlidea || {};
  window.MKDSlidea.mount = mountAll;
})();
