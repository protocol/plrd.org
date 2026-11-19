(() => {
  'use strict';

  // The unenhanced document is complete: anchors, both audiences, native details.
  const tabList = document.querySelector('[data-audience-tabs]');
  const tabs = [...tabList.querySelectorAll('[data-audience]')];
  const panels = [...document.querySelectorAll('[data-audience-panel]')];

  function selectAudience(id, focus = false, updateHistory = false) {
    if (!tabs.some(tab => tab.dataset.audience === id)) return;
    tabs.forEach(tab => {
      const selected = tab.dataset.audience === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus({ preventScroll: true });
    });
    panels.forEach(panel => { panel.hidden = panel.id !== id; });
    if (updateHistory && window.location.hash !== `#${id}`) {
      window.history.pushState(null, '', `#${id}`);
    }
  }

  tabList.setAttribute('role', 'tablist');
  tabs.forEach(tab => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', tab.dataset.audience);
    const panel = document.getElementById(tab.dataset.audience);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectAudience(tab.dataset.audience, true, true);
    });
    tab.addEventListener('keydown', event => {
      const index = tabs.indexOf(tab);
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else if (event.key === ' ' || event.key === 'Enter') next = index;
      else return;
      event.preventDefault();
      selectAudience(tabs[next].dataset.audience, true, true);
    });
  });
  function syncAudienceFromLocation() {
    if (!window.location.hash) {
      selectAudience('for-governments');
      return;
    }
    const target = document.getElementById(window.location.hash.slice(1));
    const panel = target?.closest('[data-audience-panel]');
    if (panel) selectAudience(panel.id);
  }
  selectAudience('for-governments');
  syncAudienceFromLocation();
  window.addEventListener('hashchange', syncAudienceFromLocation);
  window.addEventListener('popstate', syncAudienceFromLocation);

  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('site-nav');
  const header = document.querySelector('.site-header');
  const mobile = () => window.innerWidth <= 800;

  function setMenu(open, returnFocus = false) {
    const expanded = mobile() && open;
    navigation.hidden = mobile() && !expanded;
    menuToggle.setAttribute('aria-expanded', String(expanded));
    menuToggle.querySelector('[data-menu-label]').textContent = expanded ? 'Close' : 'Menu';
    menuToggle.querySelector('.menu-symbol').textContent = expanded ? '−' : '＋';
    if (returnFocus && mobile()) menuToggle.focus({ preventScroll: true });
  }

  function syncNavigation() {
    const focusWillHide = mobile() && navigation.contains(document.activeElement);
    const toggleWillHide = !mobile() && document.activeElement === menuToggle;
    menuToggle.hidden = !mobile();
    setMenu(false, focusWillHide);
    if (toggleWillHide) navigation.querySelector('a').focus({ preventScroll: true });
  }

  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile() && !navigation.hidden) {
      event.preventDefault();
      setMenu(false, true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (mobile() && !navigation.hidden && !header.contains(event.target)) {
      setMenu(false, navigation.contains(document.activeElement));
    }
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !mobile()) return;
    setMenu(false);
    const target = document.getElementById(link.hash.slice(1));
    if (target) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
  }));
  window.addEventListener('resize', syncNavigation);
  syncNavigation();

  // Native details retains keyboard/no-JS behavior; Escape is an enhancement.
  document.querySelectorAll('[data-research-details]').forEach(details => {
    details.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !details.open) return;
      event.preventDefault();
      details.open = false;
      details.querySelector('summary').focus({ preventScroll: true });
    });
  });
})();
