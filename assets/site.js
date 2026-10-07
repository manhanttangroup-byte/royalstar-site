// Royal Star Corp — site behaviour: Google tag (inert until real IDs), WhatsApp click tracking, calculator, lead form.
(function () {
  // ---- Google tag: replace the IDs; while they contain XXXX nothing loads.
  var GA4_ID = 'G-XXXXXXXXXX', ADS_ID = 'AW-XXXXXXXXX', ADS_LABEL = 'XXXXXXXXXXXXXXXXXXX';
  var real = function (id) { return id && id.indexOf('XXXX') < 0; };
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  var first = real(GA4_ID) ? GA4_ID : (real(ADS_ID) ? ADS_ID : null);
  if (first) {
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + first;
    document.head.appendChild(s); gtag('js', new Date());
    if (real(GA4_ID)) gtag('config', GA4_ID);
    if (real(ADS_ID)) gtag('config', ADS_ID);
  }
  var RS = window.RS || {};
  var LEADS_URL = 'https://script.google.com/macros/s/AKfycbzIgof3ehZQGZ-uN2R-G_j1KzunlzAWucOWLKAvedQ3aTxXCBhShZLj_Vwnl8mqQiRreg/exec'; // Google Apps Script: saves to "Royal Star — Leads do site" sheet + emails Rui
  function sendLead(fields) {  // fire-and-forget; works even as the page navigates to WhatsApp
    try {
      var p = new URLSearchParams(location.search), body = new URLSearchParams(fields);
      ['utm_source', 'utm_campaign', 'utm_content'].forEach(function (k) { if (p.get(k)) body.set(k, p.get(k)); });
      body.set('pagina', location.pathname); body.set('lang', RS.lang || '');
      if (!(navigator.sendBeacon && navigator.sendBeacon(LEADS_URL, body)))
        fetch(LEADS_URL, { method: 'POST', mode: 'no-cors', body: body, keepalive: true });
      store('rs_lead_done', '1');  // never show the pop-up to someone who already left a lead
    } catch (e) {}
  }
  function convert() { if (real(ADS_ID) && real(ADS_LABEL)) gtag('event', 'conversion', { send_to: ADS_ID + '/' + ADS_LABEL }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} }

  // ---- lead pop-up: city -> phone (lead saved here) -> name/email -> WhatsApp/call. Extra to the contact forms.
  // Bottom sheet on phones (Google penalises full-screen mobile interstitials), corner card on desktop.
  // Once per visitor: closing hides it for 7 days; leaving a phone (here or in any form) hides it for good.
  (function leadPopup() {
    var pt = RS.lang === 'pt', skip = { privacy: 1, terms: 1, accessibility: 1, contact: 1 };
    if (skip[RS.key] || store('rs_lead_done') || +(store('rs_pop_until') || 0) > Date.now()) return;
    if (/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)) return;
    var T = pt ? {
      t1: 'Receba os preços atuais de imóveis na Flórida. Qual cidade?', other: 'Outra cidade / ainda não sei', next: 'Continuar',
      t2: 'Para qual WhatsApp o Rui manda os preços de {c}?', ph: '+55 11 …', fl: 'Flórida', ask: 'Pediu os preços atuais de imóveis em ',
      consent: 'Ao continuar, você aceita receber contato do Rui Cunha (Royal Star Corp) por WhatsApp, telefone ou email. Sem spam.',
      bad: 'Confira o número, com DDD e código do país.', t3: 'Recebido! Como o Rui deve chamar você?', name: 'Seu nome', email: 'Seu email (opcional)',
      send: 'Enviar', t4: 'Pronto! O Rui vai mandar os preços de {c} no seu WhatsApp.', t4b: 'Quer adiantar? Fale agora:', wa: 'Chamar no WhatsApp', call: 'Ligar',
      close: 'Fechar', waMsg: 'Olá Rui! Quero saber mais sobre imóveis em '
    } : {
      t1: 'Get current home prices in Florida. Which city?', other: 'Another city / not sure yet', next: 'Continue',
      t2: 'Which WhatsApp should Rui send the {c} prices to?', ph: '+1 954 …', fl: 'Florida', ask: 'Asked for current home prices in ',
      consent: 'By continuing, you agree to be contacted by Rui Cunha (Royal Star Corp) by WhatsApp, phone or email. No spam.',
      bad: 'Please check the number, including country code.', t3: 'Got it! What name should Rui use?', name: 'Your name', email: 'Your email (optional)',
      send: 'Send', t4: 'Done! Rui will send you {c} prices on WhatsApp.', t4b: 'Want to talk now?', wa: 'Chat on WhatsApp', call: 'Call',
      close: 'Close', waMsg: 'Hi Rui! I would like to know more about homes in '
    };
    var lid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6), city = '', box, shown = false;
    var code = (RS.lang || '') + '-' + (RS.key || '') + '-popup';
    function C(s) { return s.replace('{c}', esc(city && city !== T.other ? city : T.fl)); }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function step(html, onSubmit) {
      box.querySelector('.lp-body').innerHTML = html;
      var f = box.querySelector('form');
      if (f) f.addEventListener('submit', function (e) { e.preventDefault(); onSubmit(f); });
    }
    function close() { box.remove(); if (!store('rs_lead_done')) store('rs_pop_until', String(Date.now() + 7 * 864e5)); }
    function done(name) {
      var wa = 'https://wa.me/' + (RS.wa || '19548508640') + '?text=' + encodeURIComponent(T.waMsg + (city || 'Florida') + (name ? ' (' + name + ')' : '') + '.');
      step('<p class="lp-title" id="lp-t">' + C(T.t4) + '</p><p>' + T.t4b + '</p><div class="lp-cta"><a class="btn btn-wa" data-loc="popup" href="' + esc(wa) +
           '">' + T.wa + '</a><a class="btn lp-call" data-loc="popup" href="tel:+19548508640">' + T.call + '</a></div>');
    }
    function show() {
      if (shown) return; shown = true;
      box = document.createElement('div'); box.className = 'lp'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'lp-t');
      box.innerHTML = '<button type="button" class="lp-x" aria-label="' + T.close + '">&times;</button><div class="lp-body"></div>';
      document.body.appendChild(box);
      box.querySelector('.lp-x').addEventListener('click', close);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.isConnected) close(); });
      var opts = (RS.cities || []).map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
      step('<form><label class="lp-title" id="lp-t" for="lp-city">' + T.t1 + '</label><select id="lp-city" required><option value="">—</option>' + opts +
           '<option>' + T.other + '</option></select><button class="btn" type="submit">' + T.next + '</button></form>', function (f) {
        city = f.querySelector('select').value;
        step('<form><label class="lp-title" id="lp-t" for="lp-tel">' + C(T.t2) + '</label><input id="lp-tel" type="tel" autocomplete="tel" inputmode="tel" placeholder="' + T.ph +
             '" required aria-describedby="lp-c"><span class="lp-err" role="alert"></span><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
             '<small id="lp-c">' + T.consent + '</small><button class="btn" type="submit">' + T.next + '</button></form>', function (f) {
          var tel = f.querySelector('#lp-tel').value.trim();
          if (tel.replace(/\D/g, '').length < 8) { f.querySelector('.lp-err').textContent = T.bad; return; }
          if (f.website.value) return close();  // bot
          sendLead({ tel: tel, cidade: city, lid: lid, etapa: 'telefone', codigo: code, msg: T.ask + (city || T.fl) });
          gtag('event', 'generate_lead', { page_key: RS.key, page_lang: RS.lang, link_location: 'popup' }); convert();
          step('<form><p class="lp-title" id="lp-t">' + T.t3 + '</p><label>' + T.name + '<input name="n" autocomplete="name"></label><label>' + T.email +
               '<input name="e" type="email" autocomplete="email"></label><button class="btn" type="submit">' + T.send + '</button></form>', function (f) {
            var n = f.n.value.trim(), m = f.e.value.trim();
            if (n || m) sendLead({ nome: n, email: m, tel: tel, cidade: city, lid: lid, etapa: 'completo', codigo: code });
            done(n);
          });
          box.querySelector('input[name=n]').focus();
        });
        box.querySelector('#lp-tel').focus();
      });
    }
    setTimeout(show, 6000);
    addEventListener('scroll', function onS() {
      if (scrollY + innerHeight > document.documentElement.scrollHeight * 0.5) { removeEventListener('scroll', onS); show(); }
    }, { passive: true });
  })();
  // ---- end lead pop-up (brasil landing page reuses the block above: launch-kit/landing-page/add_popup.py)


  // ---- remember an explicit language choice so the auto-Portuguese redirect never fights the visitor
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-setlang]');
    if (a) { try { localStorage.setItem('rs_lang', a.getAttribute('data-setlang')); } catch (_) {} }
  });

  // ---- every WhatsApp / phone click = a lead event (conversion when Ads ID is set)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me"], a[href^="tel:"]');
    if (!a) return;
    var kind = a.href.indexOf('wa.me') > -1 ? 'whatsapp_click' : 'phone_click';
    gtag('event', kind, { page_key: RS.key, page_lang: RS.lang, link_location: a.getAttribute('data-loc') || 'body' });
    if (real(ADS_ID) && real(ADS_LABEL)) gtag('event', 'conversion', { send_to: ADS_ID + '/' + ADS_LABEL });
  });

  // ---- mortgage calculator
  var calc = document.getElementById('calc');
  if (calc) {
    var pt = calc.getAttribute('data-lang') === 'pt';
    var money = function (n) { return 'US$ ' + Math.round(n).toLocaleString(pt ? 'pt-BR' : 'en-US'); };
    var v = function (id) { return parseFloat(document.getElementById(id).value) || 0; };
    var run = function () {
      var price = v('c-price'), down = price * v('c-down') / 100, loan = Math.max(price - down, 0);
      var r = v('c-rate') / 100 / 12, n = v('c-term') * 12;
      var pi = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
      var tax = price * v('c-tax') / 100 / 12, ins = v('c-ins') / 12, hoa = v('c-hoa');
      var total = pi + tax + ins + hoa;
      document.getElementById('c-out').innerHTML =
        (pt ? 'Parcela mensal estimada' : 'Estimated monthly payment') + '<b>' + money(total) + '</b><table>' +
        '<tr><td>' + (pt ? 'Entrada' : 'Down payment') + '</td><td>' + money(down) + '</td></tr>' +
        '<tr><td>' + (pt ? 'Valor financiado' : 'Loan amount') + '</td><td>' + money(loan) + '</td></tr>' +
        '<tr><td>' + (pt ? 'Principal + juros' : 'Principal & interest') + '</td><td>' + money(pi) + '</td></tr>' +
        '<tr><td>' + (pt ? 'Imposto predial' : 'Property tax') + '</td><td>' + money(tax) + '</td></tr>' +
        '<tr><td>' + (pt ? 'Seguro' : 'Insurance') + '</td><td>' + money(ins) + '</td></tr>' +
        '<tr><td>HOA</td><td>' + money(hoa) + '</td></tr></table>';
    };
    calc.addEventListener('input', run); run();
    var cl = document.getElementById('calc-lead');
    if (cl) cl.addEventListener('submit', function (e) {
      e.preventDefault();
      var tel = cl.tel.value.trim(), out = cl.querySelector('.lp-err');
      if (tel.replace(/\D/g, '').length < 8) { out.textContent = pt ? 'Confira o número, com DDD e código do país.' : 'Please check the number, including country code.'; return; }
      if (cl.website.value) return;  // bot
      var sim = (pt ? 'Simulação: imóvel ' : 'Simulation: home ') + money(v('c-price')) + ', ' + (pt ? 'entrada ' : 'down ') + v('c-down') + '%, ' +
        (pt ? 'juros ' : 'rate ') + v('c-rate') + '%, ' + v('c-term') + (pt ? ' anos. Parcela estimada: ' : ' yrs. Est. payment: ') +
        document.querySelector('#c-out b').textContent + (pt ? '/mês' : '/mo');
      sendLead({ tel: tel, msg: sim, codigo: (RS.lang || '') + '-calculator-sim' });
      gtag('event', 'generate_lead', { page_key: RS.key, page_lang: RS.lang, link_location: 'calculator' }); convert();
      cl.innerHTML = '<p class="calc-lead-ok">' + (pt ? 'Pronto! O Rui vai mandar esta simulação no seu WhatsApp e ajustar para o seu caso.' :
        'Done! Rui will send this simulation to your WhatsApp and adjust it to your case.') + '</p>';
    });
  }

  // ---- lead form -> opens WhatsApp with the answers (nothing stored here)
  var lead = document.getElementById('lead');
  if (lead) {
    lead.addEventListener('submit', function (e) {
      e.preventDefault();
      var pt = lead.getAttribute('data-lang') === 'pt', f = lead.elements, err = document.getElementById('lead-err');
      if (!f.nome.value.trim()) { err.textContent = pt ? 'Escreva seu nome.' : 'Please enter your name.'; f.nome.focus(); return; }
      if (f.tel.value.replace(/\D/g, '').length < 8) { err.textContent = pt ? 'Informe seu WhatsApp com DDD/código do país.' : 'Please enter your WhatsApp/phone with country code.'; f.tel.focus(); return; }
      if (f.website && f.website.value) return;  // bot
      if (!f.ok.checked) { err.textContent = pt ? 'Marque a caixa de consentimento para continuar.' : 'Please tick the consent box to continue.'; f.ok.focus(); return; }
      var sell = lead.getAttribute('data-key') === 'sell';
      var msg = (pt ? 'Olá Rui, aqui é ' : 'Hi Rui, this is ') + f.nome.value.trim() + '. ' +
        (sell ? (pt ? 'Quero uma avaliação do meu imóvel' : "I'd like a market valuation") + (f.end && f.end.value.trim() ? ': ' + f.end.value.trim() : '') + '. ' : '') +
        (f.msg.value.trim() ? f.msg.value.trim() + ' ' : '') + '(' + (RS.lang || '') + '-' + (RS.key || '') + '-form)';
      sendLead({ nome: f.nome.value.trim(), tel: f.tel.value.trim(), endereco: f.end ? f.end.value.trim() : '',
                 msg: f.msg.value.trim(), codigo: (RS.lang || '') + '-' + (RS.key || '') + '-form' });
      gtag('event', 'whatsapp_click', { page_key: RS.key, page_lang: RS.lang, link_location: 'form' });
      gtag('event', 'generate_lead', { page_key: RS.key, page_lang: RS.lang }); convert();
      setTimeout(function () { location.href = 'https://wa.me/' + (RS.wa || '19548508640') + '?text=' + encodeURIComponent(msg); }, 150);
    });
  }
  // ---- latest YouTube videos (videos.json is refreshed every 3h by a GitHub Action from the channel feed)
  var yt = document.getElementById('yt-latest');
  if (yt && window.fetch) {
    fetch(yt.getAttribute('data-src'), { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
      var vids = (d.videos || []).slice(0, 3);
      if (!vids.length) return;
      var pt = yt.getAttribute('data-lang') === 'pt';
      vids.forEach(function (v) {
        var b = document.createElement('button');
        b.className = 'yt-card'; b.type = 'button';
        b.setAttribute('aria-label', (pt ? 'Assistir: ' : 'Play: ') + v.title);
        var img = document.createElement('img');
        img.src = v.thumb; img.alt = ''; img.loading = 'lazy'; img.width = 480; img.height = 360;
        var t = document.createElement('span'); t.className = 'yt-title'; t.textContent = v.title;
        var play = document.createElement('span'); play.className = 'yt-play'; play.setAttribute('aria-hidden', 'true');
        b.appendChild(img); b.appendChild(play); b.appendChild(t);
        b.addEventListener('click', function () {  // load the player only on tap (keeps the page fast)
          var f = document.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) + '?autoplay=1&rel=0';
          f.title = v.title; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
          f.className = 'yt-frame'; b.replaceWith(f);
          gtag('event', 'video_play', { video_id: v.id, page_lang: RS.lang });
        });
        yt.appendChild(b);
      });
      document.getElementById('videos').hidden = false;
    }).catch(function () {});
  }
})();
