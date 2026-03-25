/**
 * app.js — Dr. Husain Aziz Academic Website
 * CSV-driven data layer: edit CSV files in /data to update the site.
 * Handles: CSV loading, dynamic rendering, dark mode, navigation, animations.
 */
(function () {
  'use strict';

  // ============================================
  // CSV PARSER (line-by-line approach, handles quoted fields)
  function parseCSVText(text) {
    var rows = [];
    var headers = null;
    var lines = splitCSVLines(text);

    for (var i = 0; i < lines.length; i++) {
      var fields = splitCSVFields(lines[i]);
      if (fields.length === 0 || (fields.length === 1 && fields[0] === '')) continue;
      if (!headers) {
        headers = fields;
      } else {
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          obj[headers[j]] = (j < fields.length ? fields[j] : '').trim();
        }
        rows.push(obj);
      }
    }
    return rows;
  }

  function splitCSVLines(text) {
    var lines = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        current += ch;
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        lines.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.length > 0) lines.push(current);
    return lines;
  }

  function splitCSVFields(line) {
    var fields = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  }

  function loadCSV(path) {
    return fetch(path)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (text) { return parseCSVText(text); });
  }

  // XHR fallback for file:// protocol (where fetch may fail)
  function loadCSVWithFallback(path) {
    return loadCSV(path).catch(function () {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.onload = function () {
          if (xhr.status === 200 || xhr.status === 0) {
            resolve(parseCSVText(xhr.responseText));
          } else {
            reject(new Error('XHR failed: ' + xhr.status));
          }
        };
        xhr.onerror = function () { reject(new Error('XHR network error')); };
        xhr.send();
      });
    });
  }

  // ============================================
  // ESCAPE HTML helper
  // ============================================
  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  // ============================================
  // RENDER: Publications
  // ============================================
  function renderPublications(data) {
    var container = document.getElementById('pub-list');
    if (!container || !data.length) return;

    // Sort by citations descending (treat "New" and empty as 0 for sorting, but put "New" first among 0s)
    var sorted = data.filter(function (d) { return d.type === 'journal' || d.type === 'book_chapter'; });
    sorted.sort(function (a, b) {
      var ca = parseInt((a.citations || '0').replace(/[^0-9]/g, ''), 10) || 0;
      var cb = parseInt((b.citations || '0').replace(/[^0-9]/g, ''), 10) || 0;
      if (cb !== ca) return cb - ca;
      return parseInt(b.year || 0, 10) - parseInt(a.year || 0, 10);
    });

    // Show top N (configurable — change this number to show more/fewer)
    var showCount = 12;
    var top = sorted.slice(0, showCount);

    var html = '';
    top.forEach(function (pub) {
      var citeVal = pub.citations || '';
      var isNew = citeVal.toLowerCase() === 'new' || citeVal === '';
      var citeDisplay = isNew ? 'New' : parseInt(citeVal, 10).toLocaleString();
      var citeLabel = isNew ? '&nbsp;' : 'cited';
      var doiLink = pub.doi ? ' <a href="https://doi.org/' + esc(pub.doi) + '" target="_blank" rel="noopener noreferrer" class="pub-item__doi" aria-label="DOI link">DOI</a>' : '';

      html += '<li class="pub-item">'
        + '<div>'
        + '<div class="pub-item__title">' + esc(pub.title) + '</div>'
        + '<div class="pub-item__authors">' + esc(pub.authors) + '</div>'
        + '<div class="pub-item__meta">'
        + '<span class="pub-item__journal">' + esc(pub.journal) + '</span> &middot; ' + esc(pub.year)
        + doiLink
        + '</div>'
        + '</div>'
        + '<div class="pub-item__citations">'
        + '<span class="pub-item__citations-count">' + citeDisplay + '</span>'
        + '<span class="pub-item__citations-label">' + citeLabel + '</span>'
        + '</div>'
        + '</li>';
    });

    container.innerHTML = html;
  }

  // ============================================
  // RENDER: Citation Stats
  // ============================================
  function renderCitationStats(data) {
    var container = document.getElementById('citation-stats');
    if (!container || !data.length) return;

    var stats = {};
    data.forEach(function (row) {
      stats[row.metric] = row.value;
    });

    container.innerHTML =
      '<div class="citation-stat"><div class="citation-stat__value" data-count="' + esc(stats.citations || '0') + '">' + esc(stats.citations || '0') + '</div><div class="citation-stat__label">Citations</div></div>'
      + '<div class="citation-stat"><div class="citation-stat__value" data-count="' + esc(stats.h_index || '0') + '">' + esc(stats.h_index || '0') + '</div><div class="citation-stat__label">h-index</div></div>'
      + '<div class="citation-stat"><div class="citation-stat__value" data-count="' + esc(stats.i10_index || '0') + '">' + esc(stats.i10_index || '0') + '</div><div class="citation-stat__label">i10-index</div></div>';

    // Re-observe for counter animation
    setupCounterAnimation();
  }

  // ============================================
  // RENDER: Grants
  // ============================================
  function renderGrants(data) {
    var container = document.getElementById('grants-grid');
    if (!container || !data.length) return;

    // Show active grants first, then complete, sorted by amount descending
    var sorted = data.slice().sort(function (a, b) {
      var statusOrder = { 'Active': 0, 'Complete': 1, 'Complete (ORNL)': 2 };
      var sa = statusOrder[a.status] !== undefined ? statusOrder[a.status] : 3;
      var sb = statusOrder[b.status] !== undefined ? statusOrder[b.status] : 3;
      if (sa !== sb) return sa - sb;
      var amtA = parseInt((a.amount || '0').replace(/[^0-9]/g, ''), 10);
      var amtB = parseInt((b.amount || '0').replace(/[^0-9]/g, ''), 10);
      return amtB - amtA;
    });

    // Only show active grants on the website (keep it focused)
    var active = sorted.filter(function (g) { return g.status === 'Active'; });

    var html = '';
    active.forEach(function (grant) {
      var period = '';
      if (grant.start_date && grant.end_date) {
        period = esc(grant.start_date) + ' – ' + esc(grant.end_date);
      }
      html += '<div class="grant-card">'
        + '<span class="grant-card__sponsor">' + esc(grant.sponsor) + '</span>'
        + '<div class="grant-card__title">' + esc(grant.title) + '</div>'
        + '<div class="grant-card__amount">' + esc(grant.amount) + '</div>'
        + '<div class="grant-card__details">'
        + '<span class="grant-card__role">' + esc(grant.role) + '</span>'
        + (period ? '<span>' + period + '</span>' : '')
        + '</div>'
        + '</div>';
    });

    container.innerHTML = html;

    // Re-observe for stagger animation
    container.classList.remove('stagger--visible');
    staggerObserver.observe(container);
  }

  // ============================================
  // RENDER: Awards
  // ============================================
  function renderAwards(data) {
    var container = document.getElementById('awards-list');
    if (!container || !data.length) return;

    var medalSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>';

    var html = '';
    data.forEach(function (award) {
      html += '<li class="award-item">'
        + '<div class="award-item__icon">' + medalSVG + '</div>'
        + '<div class="award-item__content">'
        + '<div class="award-item__title">' + esc(award.title) + '</div>'
        + '<span class="award-item__year">' + esc(award.year) + '</span>'
        + '</div>'
        + '</li>';
    });

    container.innerHTML = html;
    container.classList.remove('stagger--visible');
    staggerObserver.observe(container);
  }

  // ============================================
  // RENDER: Students
  // ============================================
  function renderStudents(data) {
    var container = document.getElementById('students-table');
    if (!container || !data.length) return;

    // Split into current (active advisees) and graduated/other
    var current = data.filter(function (s) { return s.role === 'Chair' && (s.status === 'Current' || s.status === 'Graduated'); });

    var html = '<table><thead><tr><th>Student</th><th>Degree</th><th>Role</th><th>Status</th></tr></thead><tbody>';
    current.forEach(function (s) {
      var statusText = s.status === 'Graduated'
        ? 'Graduated ' + esc(s.graduation)
        : 'Expected ' + esc(s.graduation);
      html += '<tr>'
        + '<td>' + esc(s.name) + '</td>'
        + '<td>' + esc(s.degree) + '</td>'
        + '<td>' + esc(s.role) + '</td>'
        + '<td>' + statusText + '</td>'
        + '</tr>';
    });
    html += '</tbody></table>';

    container.innerHTML = html;
  }

  // ============================================
  // RENDER: Projects (Media-Forward Cards)
  // ============================================
  function renderProjects(data) {
    var container = document.getElementById('projects-grid');
    if (!container || !data.length) return;

    var playSVG = '<svg viewBox="0 0 24 24"><polygon points="8,5 20,12 8,19"/></svg>';

    var html = '';
    data.forEach(function (project) {
      var id = project.id || '';
      var category = project.category || '';
      var title = project.title || '';
      var summary = project.summary || '';
      var imageUrl = project.image_url || '';
      var gifUrl = project.gif_url || '';
      var youtubeId = project.youtube_id || '';
      var tags = project.tags ? project.tags.split('|') : [];
      var status = project.status || '';

      // Determine media source: gif > image > svg placeholder
      var mediaSrc = gifUrl || imageUrl || './assets/projects/' + id + '.svg';
      var isYouTube = youtubeId.length > 0;
      var thumbnailUrl = isYouTube
        ? 'https://img.youtube.com/vi/' + esc(youtubeId) + '/hqdefault.jpg'
        : '';

      // Build media HTML
      var mediaHTML = '<div class="project-card__media">';
      if (isYouTube) {
        mediaHTML += '<img src="' + thumbnailUrl + '" alt="' + esc(title) + ' video thumbnail" loading="lazy">';
        mediaHTML += '<div class="project-card__play-overlay" data-youtube="' + esc(youtubeId) + '" role="button" aria-label="Play video: ' + esc(title) + '">';
        mediaHTML += '<div class="project-card__play-btn">' + playSVG + '</div>';
        mediaHTML += '</div>';
      } else {
        mediaHTML += '<img src="' + esc(mediaSrc) + '" alt="' + esc(title) + ' visualization" loading="lazy">';
      }
      mediaHTML += '</div>';

      // Build tags HTML
      var tagsHTML = '';
      tags.forEach(function (tag) {
        tagsHTML += '<span class="project-card__tag">' + esc(tag.trim()) + '</span>';
      });
      var statusClass = status.toLowerCase() === 'active' ? 'active' : 'complete';
      tagsHTML += '<span class="project-card__status project-card__status--' + statusClass + '">' + esc(status) + '</span>';

      html += '<div class="project-card" data-category="' + esc(category) + '">'
        + mediaHTML
        + '<div class="project-card__body">'
        + '<div class="project-card__category">' + esc(category) + '</div>'
        + '<div class="project-card__title">' + esc(title) + '</div>'
        + '<div class="project-card__summary">' + esc(summary) + '</div>'
        + '<div class="project-card__footer">' + tagsHTML + '</div>'
        + '</div>'
        + '</div>';
    });

    container.innerHTML = html;

    // Re-observe for stagger animation
    container.classList.remove('stagger--visible');
    staggerObserver.observe(container);

    // Bind YouTube play buttons
    container.querySelectorAll('.project-card__play-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function () {
        var ytId = this.getAttribute('data-youtube');
        if (!ytId) return;
        var mediaDiv = this.parentElement;
        var videoDiv = document.createElement('div');
        videoDiv.className = 'project-card__video';
        videoDiv.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + ytId + '?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
        mediaDiv.appendChild(videoDiv);
        this.style.display = 'none';
      });
    });

    // Bind filter pills
    setupProjectFilters();
  }

  function setupProjectFilters() {
    var pills = document.querySelectorAll('.filter-pill');
    var cards = document.querySelectorAll('.project-card');
    if (!pills.length || !cards.length) return;

    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var filter = this.getAttribute('data-filter');

        pills.forEach(function (p) { p.classList.remove('filter-pill--active'); });
        this.classList.add('filter-pill--active');

        cards.forEach(function (card) {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.classList.remove('project-card--hidden');
          } else {
            card.classList.add('project-card--hidden');
          }
        });
      });
    });
  }

  // ============================================
  // RENDER: News / Recent Highlights (Left/Right Timeline)
  // ============================================
  var MONTH_NAMES = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

  function formatNewsDate(raw) {
    // Convert "2025-07" → "July 2025", "2024-04" → "April 2024"
    if (!raw) return '';
    var parts = raw.split('-');
    if (parts.length >= 2) {
      var y = parts[0];
      var m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) return MONTH_NAMES[m - 1] + ' ' + y;
    }
    return raw; // fallback: return as-is
  }

  function renderNews(data) {
    var container = document.getElementById('news-list');
    if (!container || !data.length) return;

    // Show top 6 most recent items (even number works best for left/right)
    var top = data.slice(0, 6);
    var html = '';
    top.forEach(function (item, idx) {
      var side = (idx % 2 === 0) ? 'left' : 'right';
      var linkHtml = item.link
        ? ' <a href="' + esc(item.link) + '" target="_blank" rel="noopener noreferrer" class="news-tl-link">Read more &rarr;</a>'
        : '';
      html += '<div class="news-tl-item news-tl-item--' + side + '">'
        + '<div class="news-tl-card">'
        + '<div class="news-tl-date">' + esc(formatNewsDate(item.date)) + '</div>'
        + '<div class="news-tl-headline">' + esc(item.headline) + '</div>'
        + '<div class="news-tl-desc">' + esc(item.description) + linkHtml + '</div>'
        + '</div>'
        + '</div>';
    });

    container.innerHTML = html;
  }

  // ============================================
  // LOAD ALL DATA
  // ============================================
  function loadAllData() {
    var basePath = './data/';

    loadCSVWithFallback(basePath + 'projects.csv').then(renderProjects).catch(function (e) { console.warn('Could not load projects.csv:', e); });
    loadCSVWithFallback(basePath + 'publications.csv').then(renderPublications).catch(function (e) { console.warn('Could not load publications.csv:', e); });
    loadCSVWithFallback(basePath + 'citation_stats.csv').then(renderCitationStats).catch(function (e) { console.warn('Could not load citation_stats.csv:', e); });
    loadCSVWithFallback(basePath + 'grants.csv').then(renderGrants).catch(function (e) { console.warn('Could not load grants.csv:', e); });
    loadCSVWithFallback(basePath + 'awards.csv').then(renderAwards).catch(function (e) { console.warn('Could not load awards.csv:', e); });
    loadCSVWithFallback(basePath + 'students.csv').then(renderStudents).catch(function (e) { console.warn('Could not load students.csv:', e); });
    loadCSVWithFallback(basePath + 'news.csv').then(renderNews).catch(function (e) { console.warn('Could not load news.csv:', e); });
  }

  // ============================================
  // DARK MODE TOGGLE
  // ============================================
  var themeToggle = document.querySelector('[data-theme-toggle]');
  var root = document.documentElement;
  var currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', currentTheme);
  updateThemeIcon();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', currentTheme);
      themeToggle.setAttribute('aria-label', 'Switch to ' + (currentTheme === 'dark' ? 'light' : 'dark') + ' mode');
      updateThemeIcon();
    });
  }

  function updateThemeIcon() {
    if (!themeToggle) return;
    if (currentTheme === 'dark') {
      themeToggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
    } else {
      themeToggle.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  }

  // ============================================
  // MOBILE MENU
  // ============================================
  var mobileToggle = document.querySelector('[data-mobile-toggle]');
  var mobileNav = document.getElementById('mobile-nav');
  var mobileLinks = document.querySelectorAll('[data-mobile-link]');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('mobile-nav--open');
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('mobile-nav--open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ============================================
  // HEADER SCROLL STATE
  // ============================================
  var header = document.getElementById('header');
  var lastScroll = 0;

  function updateHeader() {
    var scrollY = window.scrollY;
    if (scrollY > 50) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    lastScroll = scrollY;
  }

  // ============================================
  // ACTIVE NAV HIGHLIGHTING
  // ============================================
  var navLinks = document.querySelectorAll('.nav__link');
  var sections = [];

  navLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      var section = document.getElementById(href.substring(1));
      if (section) {
        sections.push({ el: section, link: link, id: href.substring(1) });
      }
    }
  });

  function updateActiveNav() {
    var scrollPos = window.scrollY + 120;
    var current = null;

    for (var i = sections.length - 1; i >= 0; i--) {
      if (sections[i].el.offsetTop <= scrollPos) {
        current = sections[i];
        break;
      }
    }

    navLinks.forEach(function (link) { link.classList.remove('nav__link--active'); });
    mobileLinks.forEach(function (link) { link.classList.remove('mobile-nav__link--active'); });

    if (current) {
      current.link.classList.add('nav__link--active');
      mobileLinks.forEach(function (link) {
        if (link.getAttribute('href') === '#' + current.id) {
          link.classList.add('mobile-nav__link--active');
        }
      });
    }
  }

  // ============================================
  // SCROLL ANIMATIONS (Intersection Observer)
  // ============================================
  var observerOptions = { root: null, rootMargin: '0px 0px -60px 0px', threshold: 0.1 };

  var fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in--visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(function (el) {
    fadeObserver.observe(el);
  });

  var staggerObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('stagger--visible');
        staggerObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.stagger').forEach(function (el) {
    staggerObserver.observe(el);
  });

  // ============================================
  // SCROLL EVENT (throttled)
  // ============================================
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateHeader();
        updateActiveNav();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  updateHeader();
  updateActiveNav();

  // ============================================
  // CITATION COUNTER ANIMATION
  // ============================================
  function setupCounterAnimation() {
    var statsSection = document.getElementById('citation-stats');
    if (!statsSection) return;

    var animated = false;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !animated) {
          animated = true;
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(statsSection);
  }

  function animateCounters() {
    var values = document.querySelectorAll('.citation-stat__value');
    values.forEach(function (el) {
      var target = parseInt((el.getAttribute('data-count') || el.textContent).replace(/,/g, ''), 10);
      if (isNaN(target)) return;

      var duration = 1200;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    });
  }

  // Initial setup for counter (for fallback if CSVs fail to load)
  setupCounterAnimation();

  // ============================================
  // KICK OFF DATA LOADING
  // ============================================
  loadAllData();

})();
