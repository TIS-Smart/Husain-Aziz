/* app.js — Dr. Husain Aziz Academic Portfolio */

(function () {
  'use strict';

  // ─── CSV Parser ───
  function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;
      const row = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = (values[idx] || '').trim();
      });
      rows.push(row);
    }
    return rows;
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  }

  // ─── Fetch CSV ───
  async function fetchCSV(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Failed to fetch ${path}`);
      const text = await res.text();
      return parseCSV(text);
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  // ─── Chevron SVG ───
  const chevronSVG = '<svg class="pub-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>';
  const grantChevronSVG = '<svg class="grant-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>';

  // ─── Render Citation Stats ───
  function renderCitationStats(stats) {
    const banner = document.getElementById('citation-banner');
    if (!banner || !stats.length) return;
    let html = '';
    stats.forEach(s => {
      html += `
        <div class="citation-stat">
          <div class="citation-stat__value">${Number(s.all_time).toLocaleString()}</div>
          <div class="citation-stat__label">${s.metric}</div>
        </div>`;
    });
    banner.innerHTML = html;
  }

  // ─── Render Publications ───
  let allPubsShown = false;
  const INITIAL_PUB_COUNT = 12;

  function renderPublications(pubs) {
    const list = document.getElementById('pub-list');
    const btn = document.getElementById('show-more-pubs');
    if (!list) return;

    const showCount = allPubsShown ? pubs.length : Math.min(INITIAL_PUB_COUNT, pubs.length);

    let html = '';
    for (let i = 0; i < showCount; i++) {
      const p = pubs[i];
      html += `
        <div class="pub-item fade-in" data-pub-index="${i}">
          <button class="pub-header" aria-expanded="false" onclick="togglePub(this)">
            <span class="pub-number">${i + 1}.</span>
            <div class="pub-info">
              <div class="pub-title">${escapeHTML(p.title)}</div>
              <div class="pub-meta">
                <span>${escapeHTML(p.authors)}</span>
                <span>· ${escapeHTML(p.journal)}</span>
              </div>
            </div>
            <span class="pub-citations">${Number(p.citations).toLocaleString()} cit.</span>
            ${chevronSVG}
          </button>
          <div class="pub-body">
            <div class="pub-body__inner">Abstract coming soon.</div>
          </div>
        </div>`;
    }
    list.innerHTML = html;

    if (pubs.length > INITIAL_PUB_COUNT && btn) {
      btn.style.display = 'inline-flex';
      document.getElementById('show-more-text').textContent =
        allPubsShown ? 'Show Fewer' : `Show All ${pubs.length} Publications`;
    } else if (btn) {
      btn.style.display = 'none';
    }

    // Trigger fade-in for new items
    requestAnimationFrame(() => {
      list.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    });
  }

  // ─── Toggle Publication Expand/Collapse ───
  window.togglePub = function (btn) {
    const item = btn.closest('.pub-item');
    const isExpanded = item.classList.contains('expanded');
    item.classList.toggle('expanded');
    btn.setAttribute('aria-expanded', !isExpanded);
  };

  // ─── Render Grants ───
  function renderGrants(grants) {
    const list = document.getElementById('grants-list');
    if (!list) return;

    let html = '';
    grants.forEach((g, i) => {
      const metaParts = [];
      if (g.agency) metaParts.push(`<span>${escapeHTML(g.agency)}</span>`);
      if (g.amount) metaParts.push(`<span>${escapeHTML(g.amount)}</span>`);
      if (g.period) metaParts.push(`<span>${escapeHTML(g.period)}</span>`);
      if (g.role) metaParts.push(`<span>Role: ${escapeHTML(g.role)}</span>`);
      if (g.co_pis) metaParts.push(`<span>Co-PIs: ${escapeHTML(g.co_pis)}</span>`);

      html += `
        <div class="grant-item fade-in" data-grant-index="${i}">
          <button class="grant-header" aria-expanded="false" onclick="toggleGrant(this)">
            <div class="grant-info">
              <div class="grant-title">${escapeHTML(g.title)}</div>
              <div class="grant-meta">${metaParts.join(' · ')}</div>
            </div>
            <span class="grant-badge">${escapeHTML(g.status)}</span>
            ${grantChevronSVG}
          </button>
          <div class="grant-body">
            <div class="grant-body__inner">${escapeHTML(g.description) || 'Project description coming soon.'}</div>
          </div>
        </div>`;
    });
    list.innerHTML = html;

    requestAnimationFrame(() => {
      list.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    });
  }

  // ─── Toggle Grant Expand/Collapse ───
  window.toggleGrant = function (btn) {
    const item = btn.closest('.grant-item');
    const isExpanded = item.classList.contains('expanded');
    item.classList.toggle('expanded');
    btn.setAttribute('aria-expanded', !isExpanded);
  };

  // ─── Render Awards ───
  function renderAwards(awards) {
    const grid = document.getElementById('awards-grid');
    if (!grid) return;

    const awardSVG = '<svg class="award-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>';

    let html = '';
    awards.forEach(a => {
      html += `
        <div class="award-card fade-in">
          ${awardSVG}
          <div>
            <div class="award-card__title">${escapeHTML(a.title)}</div>
            <div class="award-card__org">${escapeHTML(a.organization)}</div>
            <div class="award-card__year">${escapeHTML(a.year)}</div>
          </div>
        </div>`;
    });
    grid.innerHTML = html;

    requestAnimationFrame(() => {
      grid.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    });
  }

  // ─── Render Students ───
  function renderStudents(students) {
    const grid = document.getElementById('students-grid');
    if (!grid) return;

    let html = '';
    students.forEach(s => {
      html += `
        <div class="student-card fade-in">
          <div class="student-card__name">${escapeHTML(s.name)}</div>
          <div class="student-card__degree">${escapeHTML(s.degree)} · ${escapeHTML(s.status)}</div>
          <div class="student-card__topic">${escapeHTML(s.topic)}</div>
          <div class="student-card__meta">Started ${escapeHTML(s.year)} · ${escapeHTML(s.role)}</div>
        </div>`;
    });
    grid.innerHTML = html;

    requestAnimationFrame(() => {
      grid.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    });
  }

  // ─── Render News ───
  function renderNews(news) {
    const list = document.getElementById('news-list');
    if (!list) return;

    let html = '';
    news.forEach(n => {
      const dateStr = formatDate(n.date);
      html += `
        <div class="news-item fade-in">
          <div class="news-date">${escapeHTML(dateStr)}</div>
          <div class="news-content">
            <div class="news-content__title">${escapeHTML(n.headline)}</div>
            <div class="news-content__desc">${escapeHTML(n.description)}</div>
          </div>
        </div>`;
    });
    list.innerHTML = html;

    requestAnimationFrame(() => {
      list.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
    });
  }

  // ─── Helpers ───
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  // ─── Dark/Light Mode Toggle ───
  (function initTheme() {
    const toggle = document.querySelector('[data-theme-toggle]');
    const root = document.documentElement;
    let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    updateToggleIcon(toggle, theme);

    if (toggle) {
      toggle.addEventListener('click', () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', theme);
        toggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
        updateToggleIcon(toggle, theme);
      });
    }
  })();

  function updateToggleIcon(toggle, theme) {
    if (!toggle) return;
    toggle.innerHTML = theme === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  // ─── Mobile Nav Toggle ───
  (function initMobileNav() {
    const btn = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });

    // Close nav on link click
    nav.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  })();

  // ─── Header scroll behavior ───
  (function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;
    let lastY = 0;

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 100) {
        header.classList.add('header--scrolled');
        if (y > lastY && y > 300) {
          header.classList.add('header--hidden');
        } else {
          header.classList.remove('header--hidden');
        }
      } else {
        header.classList.remove('header--scrolled');
        header.classList.remove('header--hidden');
      }
      lastY = y;
    }, { passive: true });
  })();

  // ─── Scroll-triggered fade-in ───
  (function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Re-observe after dynamic content loads
    window._observeFadeIns = function () {
      document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el));
    };
  })();

  // ─── Active nav link on scroll ───
  (function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__link');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });

    sections.forEach(s => observer.observe(s));
  })();

  // ─── Load All Data ───
  let pubsData = [];

  async function loadAllData() {
    const [citationStats, publications, grants, awards, students, news] = await Promise.all([
      fetchCSV('./data/citation_stats.csv'),
      fetchCSV('data/publications.csv'),
      fetchCSV('./data/grants.csv'),
      fetchCSV('./data/awards.csv'),
      fetchCSV('./data/students.csv'),
      fetchCSV('./data/news.csv'),
    ]);

    pubsData = publications;

    renderCitationStats(citationStats);
    renderPublications(publications);
    renderGrants(grants);
    renderAwards(awards);
    renderStudents(students);
    renderNews(news);

    // Re-observe fade-ins for dynamically loaded content
    if (window._observeFadeIns) window._observeFadeIns();
  }

  // ─── Show More / Show Less Publications ───
  const showMoreBtn = document.getElementById('show-more-pubs');
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      allPubsShown = !allPubsShown;
      renderPublications(pubsData);
      if (window._observeFadeIns) window._observeFadeIns();
    });
  }

  // ─── Init ───
  loadAllData();

})();
