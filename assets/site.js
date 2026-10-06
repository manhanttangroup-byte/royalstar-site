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
  }

  // ---- lead form -> opens WhatsApp with the answers (nothing stored here)
  var lead = document.getElementById('lead');
  if (lead) {
    lead.addEventListener('submit', function (e) {
      e.preventDefault();
      var pt = lead.getAttribute('data-lang') === 'pt', f = lead.elements, err = document.getElementById('lead-err');
      if (!f.nome.value.trim()) { err.textContent = pt ? 'Escreva seu nome.' : 'Please enter your name.'; f.nome.focus(); return; }
      if (!f.ok.checked) { err.textContent = pt ? 'Marque a caixa de consentimento para continuar.' : 'Please tick the consent box to continue.'; f.ok.focus(); return; }
      var sell = lead.getAttribute('data-key') === 'sell';
      var msg = (pt ? 'Olá Rui, aqui é ' : 'Hi Rui, this is ') + f.nome.value.trim() + '. ' +
        (sell ? (pt ? 'Quero uma avaliação do meu imóvel' : "I'd like a market valuation") + (f.end && f.end.value.trim() ? ': ' + f.end.value.trim() : '') + '. ' : '') +
        (f.msg.value.trim() ? f.msg.value.trim() + ' ' : '') + '(' + (RS.lang || '') + '-' + (RS.key || '') + '-form)';
      gtag('event', 'whatsapp_click', { page_key: RS.key, page_lang: RS.lang, link_location: 'form' });
      if (real(ADS_ID) && real(ADS_LABEL)) gtag('event', 'conversion', { send_to: ADS_ID + '/' + ADS_LABEL });
      location.href = 'https://wa.me/' + (RS.wa || '19548508640') + '?text=' + encodeURIComponent(msg);
    });
  }
})();
