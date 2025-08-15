// Navbar active state with folder-aware matching
(function () {
  function setActive(link) {
    if (!link) return;
    var nav = link.closest('nav');
    if (!nav) return;
    nav.querySelectorAll('a').forEach(function (a) {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    });
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  }

  function normalizePath(u) {
    // Ensure directories map to .../index.html for consistent matching
    var path = u.pathname || '/';
    if (path.endsWith('/')) path = path + 'index.html';
    return path;
  }

  function dirOf(path) {
    // Return parent directory, always with trailing slash
    var i = path.lastIndexOf('/');
    if (i <= 0) return '/';
    return path.slice(0, i + 1);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav a'));
    if (!navLinks.length) return;

    var currentURL = new URL(window.location.href);
    var currPath = normalizePath(currentURL);
    var currHash = currentURL.hash || '';
    var currFileKey = (currPath + currHash).toLowerCase();
    var currNoHashKey = currPath.toLowerCase();
    var currDirKey = dirOf(currPath).toLowerCase();

    var exact = null, noHash = null, byFolder = null;

    navLinks.forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var u = new URL(href, window.location.href);
      var path = normalizePath(u);
      var hash = u.hash || '';
      var fileKey = (path + hash).toLowerCase();
      var noHashKey = path.toLowerCase();
      var dirKey = dirOf(path).toLowerCase();

      if (!exact && fileKey === currFileKey) exact = a;
      if (!noHash && noHashKey === currNoHashKey) noHash = a;
      if (!byFolder && dirKey === currDirKey) byFolder = a;
    });

    var match = exact || noHash || byFolder || navLinks[0];
    setActive(match);

    // Immediate feedback on click
    navLinks.forEach(function (a) {
      a.addEventListener('click', function () { setActive(a); });
    });
  });
})();

(function () {
  function ensureStatusEl(form) {
    let el = form.querySelector('.form-status');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-status';
      el.setAttribute('aria-live', 'polite');
      form.appendChild(el);
    }
    return el;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form =
      document.getElementById('contact-form') ||
      document.querySelector('section#contact form.contact-form') ||
      document.querySelector('.contact-form');

    if (!form) return; // No contact form on this page

    var statusEl = ensureStatusEl(form);

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      statusEl.textContent = 'Sending...';

      // Honeypot support (optional)
      if (form.querySelector('input[name="_gotcha"]')) {
        var hp = form.querySelector('input[name="_gotcha"]').value.trim();
        if (hp) {
          statusEl.textContent = 'Blocked as spam.';
          return;
        }
      }

      // Validate we have a Formspree endpoint in action
      var action = form.getAttribute('action') || '';
      if (!/^https?:\/\/(www\.)?formspree\.io\/f\//i.test(action)) {
        statusEl.textContent = 'Setup required: replace form action with your Formspree endpoint.';
        return;
      }

      try {
        const data = new FormData(form);
        const resp = await fetch(action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });

        if (resp.ok) {
          form.reset();
          statusEl.textContent = "Thanks! I’ll reply to you soon.";
        } else {
          statusEl.textContent = 'Oops—something went wrong. Please try again.';
        }
      } catch (err) {
        statusEl.textContent = 'Network error. Please try again.';
      }
    });
  });
})();
