/*
 * Builds public/Sustainability-Week-2026-Agenda.pdf, the file behind the "Download as a PDF"
 * button on /agenda. The sessions are read from schedule.ts and the partners from partners.ts.
 * The PDF does not update by itself, so run this again whenever either of them changes.
 *
 *   npm i --no-save playwright && npx playwright install chromium
 *   node scripts/agenda-pdf/build.js
 *
 * agenda-qr.svg points at https://sw.gulfuniversity.edu.bh/agenda.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'public/Sustainability-Week-2026-Agenda.pdf');
const SITE = 'https://sw.gulfuniversity.edu.bh';

const scheduleTs = fs.readFileSync(path.join(ROOT, 'src/app/components/schedule/schedule.ts'), 'utf8');
const partnersTs = fs.readFileSync(path.join(ROOT, 'src/app/components/partners/partners.ts'), 'utf8');

function literal(source, pattern) {
  const match = source.match(pattern);
  if (!match) throw new Error('Could not find ' + pattern);
  return new Function('return ' + match[1])();
}

const DAYS = literal(scheduleTs, /days: ScheduleDay\[\] = (\[[\s\S]*?\n  \]);/);
const SDG_COLORS = literal(scheduleTs, /SDG_COLORS: Record<number, string> = (\{[\s\S]*?\});/);
const SDG_TITLES = literal(scheduleTs, /SDG_TITLES: Record<number, string> = (\{[\s\S]*?\});/);
const PARTNER_ROWS = literal(partnersTs, /partnerRows = (\[[\s\S]*?\n  \]);/);
const QR = fs.readFileSync(path.join(__dirname, 'agenda-qr.svg'), 'utf8').replace(/<\?xml[^>]*\?>/, '');

const VENUES = { 1: 'The Art Hotel, Amwaj' };
const OTHER_VENUE = 'Gulf University & Bahrain Polytechnic';
const ACCENTS = {
  1: { main: '#2f6bff', soft: '#e8efff', deep: '#163a9c' },
  2: { main: '#0ea5c6', soft: '#e0f6fb', deep: '#0b6d8a' },
  3: { main: '#3f9c35', soft: '#e8f6e5', deep: '#26701f' },
  4: { main: '#f26a21', soft: '#fff0e6', deep: '#b0480f' },
  5: { main: '#c9960c', soft: '#fdf6dd', deep: '#8a6606' }
};
const TYPES = {
  opening: ['bi-megaphone-fill', 'Opening'],
  panel: ['bi-chat-square-quote-fill', 'Panel'],
  workshop: ['bi-tools', 'Workshop'],
  session: ['bi-easel2-fill', 'Session'],
  community: ['bi-people-fill', 'Community'],
  competition: ['bi-trophy-fill', 'Competition'],
  awards: ['bi-award-fill', 'Awards'],
  exhibition: ['bi-images', 'Exhibition']
};
const SLOT_ICONS = {
  Morning: 'bi-sunrise-fill',
  'Mid-day': 'bi-sun-fill',
  Afternoon: 'bi-sunset-fill',
  Parallel: 'bi-diagram-3-fill'
};

const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad = (n) => String(n).padStart(2, '0');
const sdgIcon = (n) => `TGG_Icon_Color_${pad(n)}.png`;
const weekday = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
const niceDate = (date) => date.replace(/(\d+)(st|nd|rd|th) November, (\d+)/, '$1<sup>$2</sup> November $3');

function wheel(size, { inner = 62, outer = 96, gap = 2.5, opacity = 1, mono = null, style = '' } = {}) {
  const point = (radius, deg) => {
    const rad = (deg * Math.PI) / 180;
    return `${(100 + radius * Math.cos(rad)).toFixed(2)} ${(100 + radius * Math.sin(rad)).toFixed(2)}`;
  };
  const slice = 360 / 17;
  const paths = Object.values(SDG_COLORS).map((color, i) => {
    const start = i * slice - 90 + gap / 2;
    const end = start + slice - gap;
    return `<path fill="${mono || color}" d="M${point(inner, start)} L${point(outer, start)} A${outer} ${outer} 0 0 1 ${point(outer, end)} L${point(inner, end)} A${inner} ${inner} 0 0 0 ${point(inner, start)}Z"/>`;
  });
  return `<svg class="wheel" viewBox="0 0 200 200" style="width:${size};height:${size};opacity:${opacity};${style}">${paths.join('')}</svg>`;
}

const ribbon = () => `<div class="ribbon">${Object.values(SDG_COLORS).map((c) => `<i style="background:${c}"></i>`).join('')}</div>`;

/** "Expert Talk: Title — More" becomes a small label, the title and a lighter second line. */
function splitTitle(title, type) {
  let kicker = TYPES[type][1];
  let rest = title;
  const colon = title.indexOf(': ');
  if (colon > 0 && colon <= 30) {
    kicker = title.slice(0, colon);
    rest = title.slice(colon + 2);
  }
  const parts = rest.split(/\s+(?:—|·)\s+/);
  return { kicker, main: parts[0], sub: parts.slice(1).join(' — ') };
}

function groupBySlot(items) {
  const groups = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.slot === item.slot) last.items.push(item);
    else groups.push({ slot: item.slot, items: [item] });
  }
  return groups;
}

function footer(page, total) {
  return `
    <footer class="foot">
      ${ribbon()}
      <div class="foot__row">
        <span>Sustainability Week 2026 &nbsp;·&nbsp; Gulf University</span>
        <a href="${SITE}">sw.gulfuniversity.edu.bh</a>
        <span class="foot__page">${pad(page)} / ${pad(total)}</span>
      </div>
    </footer>`;
}

function coverPage() {
  return `
  <section class="page cover">
    <div class="cover__ghost">${wheel('340mm', { opacity: 0.07, inner: 40, gap: 1.5 })}</div>
    <div class="cover__glow"></div>
    <header class="cover__logos">
      <img src="polytechnic-white.png" alt="Bahrain Polytechnic" />
      <span></span>
      <img src="main-logo-white.png" alt="Gulf University" />
    </header>
    <div class="cover__invite">Proudly invite you to</div>
    <div class="cover__wheel">
      ${wheel('128mm')}
      <div class="cover__wheel-text">
        <span class="cover__agenda">Agenda</span>
        <strong>2026</strong>
        <span class="cover__edition">3<sup>rd</sup> Edition</span>
      </div>
    </div>
    <h1 class="cover__title">Sustainability Week</h1>
    <p class="cover__theme">“Co-innovating, Leading, Sustaining…”</p>
    <p class="cover__focus">Focusing on SDG 9.5</p>
    <div class="cover__date">November 15<sup>th</sup> – 19<sup>th</sup>, 2026</div>
    <div class="cover__venues">
      <div><i class="bi bi-geo-alt-fill"></i> 15<sup>th</sup>: The Art Hotel, Amwaj</div>
      <div><i class="bi bi-geo-alt-fill"></i> 16<sup>th</sup> – 19<sup>th</sup>: Gulf University &amp; Bahrain Polytechnic</div>
    </div>
    <div class="cover__ribbon">${ribbon()}</div>
  </section>`;
}

function glancePage(total) {
  const cards = DAYS.map((day) => {
    const a = ACCENTS[day.id];
    return `
      <a class="glance" href="#day-${day.id}" style="--main:${a.main};--soft:${a.soft};--deep:${a.deep}">
        <div class="glance__num"><small>Day</small>${pad(day.id)}</div>
        <div class="glance__body">
          <div class="glance__date">${weekday(day.isoDate)} &nbsp;·&nbsp; ${niceDate(day.date)}</div>
          <h3>${esc(day.theme)}</h3>
          <div class="glance__venue"><i class="bi bi-geo-alt-fill"></i> ${esc(VENUES[day.id] || OTHER_VENUE)}</div>
          <div class="glance__sdgs">${day.sdgs.map((n) => `<img src="${sdgIcon(n)}" alt="SDG ${n}" />`).join('')}</div>
        </div>
        <div class="glance__arrow"><i class="bi bi-arrow-right"></i></div>
      </a>`;
  }).join('');
  return `
  <section class="page glance-page">
    <div class="glance-page__ghost">${wheel('150mm', { opacity: 0.1, inner: 40, gap: 1.5 })}</div>
    <div class="eyebrow"><i class="bi bi-calendar-event"></i> 5-Day Programme</div>
    <h2 class="glance-page__title">The week at a glance</h2>
    <p class="glance-page__intro">Innovate. Collaborate. Sustain. — a five-day journey of workshops, panels, expert talks, competitions and community actions, each mapped to specific UN Sustainable Development Goals.</p>
    <div class="glance-list">${cards}</div>
    ${footer(2, total)}
  </section>`;
}

function itemCard(item) {
  const { kicker, main, sub } = splitTitle(item.title, item.type);
  const sdgs = item.sdgs.length
    ? `<div class="item__sdgs">${item.sdgs.map((n) => `<img src="${sdgIcon(n)}" alt="SDG ${n}: ${esc(SDG_TITLES[n])}" />`).join('')}</div>`
    : '';
  return `
    <article class="item">
      <div class="item__icon"><i class="bi ${TYPES[item.type][0]}"></i></div>
      <div class="item__text">
        <div class="item__kicker">${esc(kicker)}</div>
        <h4>${esc(main)}</h4>
        ${sub ? `<p>${esc(sub)}</p>` : ''}
      </div>
      ${sdgs}
    </article>`;
}

function dayPage(day, page, total) {
  const a = ACCENTS[day.id];
  const groups = groupBySlot(day.items).map((group) => `
    <div class="slot" style="flex-grow:${group.items.length}">
      <div class="slot__label">
        <i class="bi ${SLOT_ICONS[group.slot] || 'bi-clock-fill'}"></i>
        <span>${esc(group.slot)}</span>
      </div>
      <div class="slot__items">${group.items.map(itemCard).join('')}</div>
    </div>`).join('');
  return `
  <section class="page day day--${day.items.length <= 5 ? 'roomy' : day.items.length <= 6 ? 'medium' : 'full'}" id="day-${day.id}" style="--main:${a.main};--soft:${a.soft};--deep:${a.deep}">
    <header class="day__head">
      <div class="day__ghost">${wheel('128mm', { mono: '#ffffff', opacity: 0.09, inner: 50, gap: 2 })}</div>
      <div class="day__number"><small>Day</small><b>${pad(day.id)}</b></div>
      <div class="day__meta">
        <div class="day__date">${weekday(day.isoDate)} &nbsp;·&nbsp; ${niceDate(day.date)}</div>
        <h2>${esc(day.theme)}</h2>
        <div class="day__venue"><i class="bi bi-geo-alt-fill"></i> ${esc(VENUES[day.id] || OTHER_VENUE)}</div>
        <div class="day__sdgs">${day.sdgs.map((n) => `<img src="${sdgIcon(n)}" alt="SDG ${n}: ${esc(SDG_TITLES[n])}" />`).join('')}</div>
      </div>
    </header>
    <div class="day__body">${groups}</div>
    ${footer(page, total)}
  </section>`;
}

function backPage() {
  const tiles = (row) => row.flat().map((p) => `<div class="tile"><img src="${p.logo}" alt="${esc(p.name)}" /></div>`).join('');
  return `
  <section class="page back">
    <div class="cover__ghost">${wheel('340mm', { opacity: 0.06, inner: 40, gap: 1.5 })}</div>
    <div class="back__top">
      <div class="back__qr">${QR}</div>
      <div class="back__cta">
        <div class="eyebrow eyebrow--gold">Keep it on your phone</div>
        <h2>Scan for the live agenda</h2>
        <p>The online agenda opens on the current day of the event.</p>
        <a href="${SITE}/agenda">sw.gulfuniversity.edu.bh/agenda</a>
      </div>
    </div>
    <div class="back__partners">
      <div class="back__label">With our partners</div>
      <div class="tiles tiles--gov">${tiles([...PARTNER_ROWS[0]].reverse())}</div>
      <div class="tiles tiles--other">${tiles(PARTNER_ROWS[1])}</div>
    </div>
    <div class="back__contact">
      <img src="main-logo-white.png" alt="Gulf University" />
      <div class="back__lines">
        <div><i class="bi bi-geo-alt-fill"></i> Building 1964, Road 4363, Kingdom of Bahrain</div>
        <div>
          <a href="tel:+97317620092"><i class="bi bi-telephone-fill"></i> +973 17620092</a>
          <a href="mailto:sdmc@gulfuniversity.edu.bh"><i class="bi bi-envelope-fill"></i> sdmc@gulfuniversity.edu.bh</a>
        </div>
      </div>
    </div>
    <div class="cover__ribbon">${ribbon()}</div>
  </section>`;
}

const CSS = fs.readFileSync(path.join(__dirname, 'agenda.css'), 'utf8');

function html() {
  const total = DAYS.length + 3;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Sustainability Week 2026 – Agenda | Gulf University</title>
  <base href="${pathToFileURL(path.join(ROOT, 'public')).href}/" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,500&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet" />
  <style>${CSS}</style>
</head>
<body>
  ${coverPage()}
  ${glancePage(total)}
  ${DAYS.map((day, i) => dayPage(day, i + 3, total)).join('')}
  ${backPage()}
</body>
</html>`;
}

(async () => {
  const file = path.join(os.tmpdir(), 'sw-agenda-pdf.html');
  fs.writeFileSync(file, html());
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // The logos and icons are far larger than they appear in print, so shrink them to keep the file light.
  await page.evaluate(async () => {
    const DPI = 300 / 96;
    await Promise.all([...document.images].map(async (img) => {
      await img.decode();
      const box = img.getBoundingClientRect();
      const scale = Math.min(1, (box.width * DPI) / img.naturalWidth, (box.height * DPI) / img.naturalHeight);
      if (scale >= 1) return;
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(img.naturalWidth * scale);
      canvas.height = Math.ceil(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        img.src = canvas.toDataURL('image/png');
        await img.decode();
      } catch {
        // A file:// image can taint the canvas; the original is kept, just larger.
      }
    }));
  });

  const overflow = await page.$$eval('.page', (pages) => pages
    .map((p, i) => [i + 1, p.scrollHeight - p.clientHeight, p.scrollWidth - p.clientWidth])
    .filter(([, h, w]) => h > 1 || w > 1));
  if (overflow.length) console.warn('OVERFLOW [page, height, width]:', JSON.stringify(overflow));

  await page.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true, tagged: true });
  await browser.close();
  console.log('Wrote', OUT, Math.round(fs.statSync(OUT).size / 1024) + ' KB');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
