// Synchronous, dependency-free pre-paint step (docs/ADR.md D12, docs/DESIGN.md §8, §9): runs inline at
// the end of the body so a `?collection=` deep link (tabs + standfirst), the visitor's saved ❤/👎
// state and their saved unit/currency are correct on first paint, before the deferred modules
// (tabs.ts, votes.ts, prefs.ts) take over interaction. It also registers the `pagereveal` listener
// for cross-document view transitions: that event can fire before deferred modules execute, so only
// a parser-run script is guaranteed to catch it. Plain JS: no sheet data, no template variables; its
// hash is registered in the CSP (astro.config.mjs). Each block is independent and swallows its own
// errors.
(function () {
  try {
    var wanted = new URLSearchParams(location.search).get('collection');
    if (wanted && /^[a-z0-9-]{1,80}$/.test(wanted)) {
      var buttons = document.querySelectorAll('#nav button[data-collection]');
      var known = false;
      for (var i = 0; i < buttons.length; i++)
        if (buttons[i].getAttribute('data-collection') === wanted) known = true;
      if (known) {
        for (var j = 0; j < buttons.length; j++) {
          var on = buttons[j].getAttribute('data-collection') === wanted;
          buttons[j].classList.toggle('on', on);
          buttons[j].setAttribute('aria-selected', on ? 'true' : 'false');
          buttons[j].tabIndex = on ? 0 : -1;
        }
        var cards = document.querySelectorAll('[data-card]');
        for (var k = 0; k < cards.length; k++)
          cards[k].hidden = cards[k].getAttribute('data-collection') !== wanted;
        var firsts = document.querySelectorAll('[data-standfirst]');
        for (var f = 0; f < firsts.length; f++)
          firsts[f].hidden = firsts[f].getAttribute('data-collection') !== wanted;
      }
    }
  } catch (e) {
    /* ignore */
  }
  try {
    var saved = JSON.parse(localStorage.getItem('sl-saved') || '{}');
    var votes = document.querySelectorAll('button[data-vote][data-rug]');
    for (var m = 0; m < votes.length; m++) {
      var b = votes[m];
      var s = saved[b.getAttribute('data-rug')];
      var state = s === true || s === 'liked' ? 'liked' : s === 'disliked' ? 'disliked' : 'none';
      var v = b.getAttribute('data-vote');
      b.setAttribute(
        'aria-pressed',
        (v === 'like' && state === 'liked') || (v === 'dislike' && state === 'disliked') ? 'true' : 'false',
      );
    }
  } catch (e) {
    /* ignore */
  }
  var curGuess = [];
  try {
    // The visitor's likely currency (owner, 2026-09-23): the browser's own time zone first, then the
    // region of its languages — no IP lookup, no third party. It is only a default: a choice made in
    // the picker is saved to `sl-cur` and always wins, and the guess itself is never saved, so a
    // traveller is guessed afresh on the next visit. The result is left on <html data-cur-guess> for
    // prefs.ts, so these tables exist once. A zone beats a language because "en-US" is the default
    // language of half the world's phones, while the clock is set to where the phone actually is.
    var ZONES = {
      MXN:
        'America/Mexico_City America/Cancun America/Merida America/Monterrey America/Matamoros ' +
        'America/Chihuahua America/Ciudad_Juarez America/Ojinaga America/Mazatlan America/Bahia_Banderas ' +
        'America/Hermosillo America/Tijuana America/Ensenada America/Santa_Isabel Mexico/General ' +
        'Mexico/BajaNorte Mexico/BajaSur',
      CAD:
        'America/Toronto America/Montreal America/Vancouver America/Edmonton America/Winnipeg ' +
        'America/Halifax America/St_Johns America/Regina America/Swift_Current America/Moncton ' +
        'America/Glace_Bay America/Goose_Bay America/Whitehorse America/Dawson America/Dawson_Creek ' +
        'America/Fort_Nelson America/Creston America/Iqaluit America/Rankin_Inlet America/Resolute ' +
        'America/Cambridge_Bay America/Inuvik America/Yellowknife America/Atikokan America/Blanc-Sablon ' +
        'America/Nipigon America/Thunder_Bay America/Rainy_River America/Pangnirtung',
      USD:
        'America/New_York America/Chicago America/Denver America/Los_Angeles America/Phoenix ' +
        'America/Anchorage America/Juneau America/Sitka America/Yakutat America/Nome America/Metlakatla ' +
        'America/Adak America/Boise America/Detroit America/Menominee America/Puerto_Rico Pacific/Honolulu',
      GBP: 'Europe/London Europe/Belfast Europe/Guernsey Europe/Jersey Europe/Isle_of_Man GB GB-Eire',
      AED: 'Asia/Dubai',
      SAR: 'Asia/Riyadh',
      EUR:
        'Atlantic/Canary Atlantic/Madeira Atlantic/Azores Africa/Ceuta Asia/Nicosia Asia/Famagusta ' +
        'Arctic/Longyearbyen Eire',
      // Europe/* means EUR below — the picker has no CHF, SEK or PLN — except where it plainly is not.
      NONE:
        'Europe/Moscow Europe/Kirov Europe/Volgograd Europe/Samara Europe/Ulyanovsk Europe/Astrakhan ' +
        'Europe/Saratov Europe/Kaliningrad Europe/Istanbul Europe/Minsk Europe/Simferopol',
    };
    var PREFIXES = [
      ['Canada/', 'CAD'],
      ['US/', 'USD'],
      ['America/Indiana/', 'USD'],
      ['America/Kentucky/', 'USD'],
      ['America/North_Dakota/', 'USD'],
      ['Europe/', 'EUR'],
    ];
    var REGIONS = {
      MXN: 'MX',
      CAD: 'CA',
      USD: 'US PR',
      GBP: 'GB GG JE IM',
      AED: 'AE',
      SAR: 'SA',
      EUR:
        'AD AT BE BG CY DE EE ES FI FR GR HR IE IT LT LU LV MC ME MT NL PT SI SK SM VA XK ' +
        'AL BA CH CZ DK HU IS LI MD MK NO PL RO RS SE UA',
    };
    var listed = function (list, key) {
      return (' ' + list + ' ').indexOf(' ' + key + ' ') >= 0;
    };
    var tz = '';
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (e) {
      /* no Intl: languages only */
    }
    var byZone = '';
    for (var zc in ZONES) if (tz && listed(ZONES[zc], tz)) byZone = zc;
    if (!byZone)
      for (var p = 0; p < PREFIXES.length; p++)
        if (tz.indexOf(PREFIXES[p][0]) === 0) {
          byZone = PREFIXES[p][1];
          break;
        }
    if (byZone && byZone !== 'NONE') curGuess.push(byZone);
    var langs =
      navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var g = 0; g < langs.length; g++) {
      var parts = String(langs[g] || '').split(/[-_]/);
      for (var sub = 1; sub < parts.length; sub++) {
        if (!/^[A-Za-z]{2}$/.test(parts[sub])) continue;
        for (var rc in REGIONS)
          if (listed(REGIONS[rc], parts[sub].toUpperCase()) && curGuess.indexOf(rc) < 0) curGuess.push(rc);
      }
    }
    if (curGuess.length) document.documentElement.setAttribute('data-cur-guess', curGuess.join(' '));
  } catch (e) {
    /* ignore */
  }
  try {
    // Unit + currency (src/scripts/prefs.ts owns the interaction; this mirrors its first render so a
    // returning visitor never sees cm/USD flash before their saved choice, and prices are grouped in
    // the visitor's locale from the start, exactly as prefs.ts will re-render them). The controls
    // can appear twice — the catalog's phone header carries its own copy (owner, 2026-09-23) — so
    // every copy is set, by id or by data attribute.
    var unit = localStorage.getItem('sl-unit') === 'ft' ? 'ft' : 'cm';
    var curWanted = [localStorage.getItem('sl-cur') || ''].concat(curGuess);
    var ratesEl = document.getElementById('sl-rates');
    var table = ratesEl && ratesEl.textContent ? JSON.parse(ratesEl.textContent) : {};
    var rates = table.rates || {};
    var symbols = table.symbols || {};
    if (typeof rates.USD !== 'number') rates.USD = 1;
    if (typeof symbols.USD !== 'string') symbols.USD = '$';
    var selects = document.querySelectorAll('#cur, select[data-cur]');
    var select = selects[0];
    var cur = 'USD';
    for (var cw = 0; cw < curWanted.length; cw++) {
      var offered = false;
      if (select && select.options)
        for (var o = 0; o < select.options.length; o++)
          if (select.options[o].value === curWanted[cw]) offered = true;
      if (offered && typeof rates[curWanted[cw]] === 'number' && typeof symbols[curWanted[cw]] === 'string') {
        cur = curWanted[cw];
        break;
      }
    }
    var toggles = document.querySelectorAll('#unitTog button[data-u], [data-unit-toggle] button[data-u]');
    for (var t = 0; t < toggles.length; t++) {
      var isOn = toggles[t].getAttribute('data-u') === unit;
      toggles[t].classList.toggle('on', isOn);
      toggles[t].setAttribute('aria-pressed', isOn ? 'true' : 'false');
    }
    for (var sl = 0; sl < selects.length; sl++) selects[sl].value = cur;
    var ftIn = function (cm) {
      var total = cm / 2.54;
      var ft = Math.floor(total / 12);
      var inch = Math.round(total - ft * 12);
      if (inch === 12) {
        ft++;
        inch = 0;
      }
      return ft + "'" + (inch ? ' ' + inch + '"' : '');
    };
    var dimsEls = document.querySelectorAll('[data-dims]');
    for (var d = 0; d < dimsEls.length; d++) {
      var w = Number(dimsEls[d].getAttribute('data-w'));
      var l = Number(dimsEls[d].getAttribute('data-l'));
      if (!w || !l) continue;
      var sep = dimsEls[d].getAttribute('data-sep') || '×';
      dimsEls[d].textContent =
        unit === 'cm' ? w + ' ' + sep + ' ' + l + ' cm' : ftIn(w) + ' ' + sep + ' ' + ftIn(l);
      dimsEls[d].hidden = false;
    }
    var priceEls = document.querySelectorAll('[data-price]');
    for (var q = 0; q < priceEls.length; q++) {
      var usd = Number(priceEls[q].getAttribute('data-usd'));
      if (!usd) continue;
      priceEls[q].textContent = symbols[cur] + Math.round(usd * rates[cur]).toLocaleString();
      priceEls[q].hidden = false;
    }
  } catch (e) {
    /* ignore */
  }
  try {
    // Arrival side of the cross-document view transition (docs/DESIGN.md §8.3): mark the document so
    // the CSS entrances stay off, note the direction, and name this page's hero (or, coming back to
    // the index, the card the visitor left from) so the browser morphs one plate into the other.
    addEventListener('pagereveal', function (e) {
      var vt = e.viewTransition;
      if (!vt) return;
      var html = document.documentElement;
      html.classList.add('vt');
      var nav = performance.getEntriesByType('navigation')[0];
      if (nav && nav.type === 'back_forward') html.classList.add('vt-back');
      if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var el = document.querySelector('.hero[data-plate]');
      if (!el) {
        var slug = null;
        try {
          slug = sessionStorage.getItem('sl-vt-slug');
          sessionStorage.removeItem('sl-vt-slug');
        } catch (err) {
          /* ignore */
        }
        if (slug && /^[a-z0-9-]{1,80}$/.test(slug)) {
          var link = document.querySelector('.card:not([hidden]) a.photo-link[href="/rugs/' + slug + '"]');
          el = link ? link.closest('[data-plate]') : null;
        }
      }
      if (!el) return;
      var r = el.getBoundingClientRect();
      if (!(r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth)) return;
      el.style.setProperty('view-transition-name', 'rug-hero');
      var clear = function () {
        el.style.removeProperty('view-transition-name');
      };
      vt.ready.then(clear, clear); // bfcache hygiene
    });
  } catch (e) {
    /* ignore */
  }
})();
