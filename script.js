/* ===== RFID MFG — interactions ===== */
(function () {
  'use strict';

  // Current year in footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Floating quick-contact widget (injected on every page)
  (function injectQuickContact() {
    var wrap = document.createElement('div');
    wrap.className = 'quick-contact';
    wrap.innerHTML =
      '<a class="qc-btn qc-wa" href="https://api.whatsapp.com/send?phone=8615815501857" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' +
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 2.09.55 4.06 1.6 5.83L2 22l4.39-1.15a9.9 9.9 0 0 0 5.65 1.76c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.13a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-2.6.68.69-2.54-.2-.31a8.23 8.23 0 0 1-1.26-4.39c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.48-1.38-1.73-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>' +
      '</a>' +
      '<a class="qc-btn qc-quote" href="contact.html">Get a Quote</a>';
    document.body.appendChild(wrap);
  })();

  // Mobile nav toggle
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Header shadow + back-to-top on scroll
  var header = document.getElementById('header');
  var toTop = document.getElementById('toTop');
  if (toTop) toTop.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  function onScroll() {
    var y = window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (toTop) toTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal-on-scroll
  var revealEls = [].slice.call(
    document.querySelectorAll(
      '.about, .product-card, .feature, .case, .sustain, .contact, .stat-card, .section__head'
    )
  );
  revealEls.forEach(function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Animated stat counters in hero
  var counters = [].slice.call(document.querySelectorAll('.hero__stats strong[data-count]'));
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var dur = 1400, start = null;
    var fmt = target >= 1000;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      var val = Math.floor(ease * target);
      el.textContent = fmt ? val.toLocaleString('en-US') : String(val);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt ? target.toLocaleString('en-US') : String(target);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var co = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { animateCount(entry.target); co.unobserve(entry.target); }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (el) { co.observe(el); });
    } else {
      counters.forEach(animateCount);
    }
  }

  // ===== Analytics helper — fires only if GA4 (gtag) is installed =====
  function track(name, params) { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) {} }

  // ===== Products megamenu (desktop) =====
  (function megamenu() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var links = nav.querySelectorAll('a'), prodLink = null, i;
    for (i = 0; i < links.length; i++) {
      var h = links[i].getAttribute('href') || '';
      if (h === 'products.html' || h === '/products/' || h === '/products') { prodLink = links[i]; break; }
    }
    if (!prodLink) return;
    var MENU = [
      { t: 'Cards', u: '/products/cards/', items: [['Hotel Keycard', 'hotel-key-card'], ['RFID / NFC Card', 'rfid-nfc-card'], ['NFC Business Card', 'nfc-business-card'], ['PVC Cards', 'pvc-cards'], ['Metal Card', 'metal-card'], ['Eco-Friendly Card', 'eco-friendly-card']] },
      { t: 'Labels & Stickers', u: '/products/labels/', items: [['UHF RFID Label', 'uhf-rfid-label'], ['NFC Printed Label', 'nfc-printed-label'], ['RFID Wet Inlay', 'rfid-wet-inlay'], ['RFID Dry Inlay', 'rfid-dry-inlay'], ['White Label', 'rfid-white-label']] },
      { t: 'RFID Tags', u: '/products/tags/', items: [['RFID Wristband', 'rfid-wristband'], ['Laundry Tag', 'rfid-laundry-tag'], ['Anti-Metal Tag', 'rfid-anti-metal-tag'], ['RFID Keyfob', 'rfid-keyfob'], ['Animal Tag', 'rfid-animal-tag'], ['Windshield Tag', 'uhf-windshield-tag']] },
      { t: 'RFID Blocking', u: '/products/blocking/', items: [['Blocking Card', 'rfid-blocking-card'], ['Blocking Sleeves', 'rfid-blocking-sleeves'], ['Blocking Wallet', 'rfid-blocking-wallet']] },
      { t: 'Hardware', u: '/products/hardware/', items: [['Reader / Writer', 'rfid-reader-writer'], ['Scan Module', 'barcode-scan-module'], ['Smart Cabinet', 'rfid-smart-cabinet'], ['IoT DTU / RTU', 'industrial-iot-dtu-rtu']] },
    ];
    var wrap = document.createElement('div');
    wrap.className = 'mm';
    prodLink.parentNode.insertBefore(wrap, prodLink);
    wrap.appendChild(prodLink);
    prodLink.setAttribute('aria-haspopup', 'true');
    prodLink.setAttribute('aria-expanded', 'false');
    var html = '';
    for (i = 0; i < MENU.length; i++) {
      var c = MENU[i], its = '';
      for (var j = 0; j < c.items.length; j++) its += '<a href="' + c.u + c.items[j][1] + '/">' + c.items[j][0] + '</a>';
      html += '<div class="mm__col"><a class="mm__cat" href="' + c.u + '">' + c.t + '</a>' + its + '<a class="mm__more" href="' + c.u + '">View all →</a></div>';
    }
    html += '<div class="mm__foot"><a href="/products/">Browse all 39 products →</a><a href="/contact/?sample=1#quoteForm">Get free samples →</a></div>';
    var panel = document.createElement('div');
    panel.className = 'mm__panel';
    panel.setAttribute('role', 'menu');
    panel.innerHTML = html;
    wrap.appendChild(panel);
    prodLink.addEventListener('click', function (e) {
      var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
      if (touch && !wrap.className.match(/\bopen\b/) && window.innerWidth > 980) { e.preventDefault(); wrap.className += ' open'; prodLink.setAttribute('aria-expanded', 'true'); }
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) { wrap.className = wrap.className.replace(/ ?\bopen\b/, ''); prodLink.setAttribute('aria-expanded', 'false'); }
    });
  })();

  // Track high-intent clicks: WhatsApp, datasheet downloads, phone
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/wa\.me|api\.whatsapp\.com/.test(href)) track('whatsapp_click', { link_url: href });
    else if (/\/datasheets\/[^"']+\.pdf/.test(href)) track('datasheet_download', { file_name: href });
    else if (/^tel:/.test(href)) track('phone_click', { number: href });
  });

  // ===== Inquiry form =====
  // Paste your endpoint below to capture leads automatically:
  //   • Formspree:          https://formspree.io/f/xxxxxxxx
  //   • Feishu lead Worker: https://your-worker.your-name.workers.dev
  // Leave it as '' to fall back to the visitor's email client (mailto).
  var FORM_ENDPOINT = 'https://formspree.io/f/mqevnade';

  var form = document.getElementById('quoteForm');
  var note = document.getElementById('formNote');

  // Prefill product category + message when arriving from a product page (?product=&cat=)
  (function prefillFromQuery() {
    if (!form || !window.URLSearchParams) return;
    var qs = new URLSearchParams(location.search);
    var prod = qs.get('product');
    var cat = qs.get('cat');
    if (cat) {
      var sel = form.querySelector('#product');
      if (sel) {
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].text.trim().toLowerCase() === cat.trim().toLowerCase()) { sel.selectedIndex = i; break; }
        }
      }
    }
    if (prod) {
      var msg = form.querySelector('#message');
      if (msg && !msg.value) { msg.value = 'I would like a wholesale quote for: ' + prod + '\nTarget quantity: \nChip / frequency: \nCustom artwork / logo: '; }
    }
    // Estimator handoff: ?qty= fills the target quantity; ?sample=1 ticks the sample box
    var qty = qs.get('qty');
    if (qty) {
      var m2 = form.querySelector('#message');
      if (m2) {
        if (m2.value.indexOf('Target quantity: ') !== -1) m2.value = m2.value.replace('Target quantity: ', 'Target quantity: ' + qty + ' ');
        else m2.value = (m2.value ? m2.value + '\n' : '') + 'Target quantity: ' + qty;
      }
    }
    if (qs.get('sample')) {
      var cb = form.querySelector('input[name="samples"]');
      if (cb) cb.checked = true;
    }
  })();

  function showNote(msg, ok) {
    if (!note) return;
    note.hidden = false;
    note.style.background = ok ? 'rgba(22,214,193,.12)' : 'rgba(220,80,80,.12)';
    note.style.color = ok ? '#0a7f6f' : '#b91c1c';
    note.textContent = msg;
  }
  function val(f, n) { return f[n] && typeof f[n].value === 'string' ? f[n].value.trim() : ''; }
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Honeypot: if a bot filled the hidden field, pretend success and drop silently.
      var hp = form.querySelector('input[name="_gotcha"]');
      if (hp && hp.value) { showNote('Thank you! Your inquiry has been sent — we’ll reply within 24 hours.', true); form.reset(); return; }
      var name = val(form, 'name');
      var email = val(form, 'email');
      var company = val(form, 'company');
      var phone = val(form, 'phone');
      var country = val(form, 'country');
      var product = val(form, 'product');
      var message = val(form, 'message');
      var samples = form.samples && form.samples.checked ? 'Yes' : 'No';
      if (!name || !email) { showNote('Please enter your name and email so we can reply.', false); return; }

      var payload = { name: name, email: email, company: company, phone: phone, country: country, product: product, samples: samples, message: message, source: location.href, _subject: (samples === 'Yes' ? '[Sample request] ' : '') + 'Website inquiry from ' + name + (company ? ' (' + company + ')' : '') };

      if (FORM_ENDPOINT) {
        var btn = form.querySelector('button[type=submit]');
        var label = btn ? btn.textContent : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (r) { if (!r.ok) throw new Error('bad status'); return r; })
          .then(function () { track('generate_lead', { product: product, samples: samples }); showNote('Thank you! Your inquiry has been sent — we’ll reply within 24 hours.', true); form.reset(); })
          .catch(function () { showNote('Sorry, sending failed. Please email us at peter@rfidmfg.com.', false); })
          .then(function () { if (btn) { btn.disabled = false; btn.textContent = label || 'Send Inquiry'; } });
      } else {
        var subject = encodeURIComponent((samples === 'Yes' ? '[Sample request] ' : '') + 'Inquiry from ' + name + (product ? ' — ' + product : ''));
        var body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + (company ? '\nCompany: ' + company : '') + (phone ? '\nPhone/WhatsApp: ' + phone : '') + (country ? '\nCountry: ' + country : '') + (product ? '\nProduct: ' + product : '') + '\nFree samples: ' + samples + '\n\n' + message);
        window.location.href = 'mailto:peter@rfidmfg.com?subject=' + subject + '&body=' + body;
        track('generate_lead', { product: product, samples: samples, method: 'mailto' });
        showNote('Opening your email app… If nothing happens, email us at peter@rfidmfg.com.', true);
        form.reset();
      }
    });
  }
})();
