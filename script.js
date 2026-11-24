/* ============================================================
   Maison MRKT — Creator Network Invite
   ============================================================ */

(function () {
  'use strict';

  // ---- Config ----
  // DEPLOY: Replace with your Google Sheets / Apps Script endpoint
  const SUBMIT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwd2_PPNi79OiiIJ7jr5igPpAJpjYh_AJAww1bxtxPhrFH_XYh5tuBUqwSasGZzQf63/exec';

  // DEPLOY: Replace with your real invite URL
  const INVITE_URL = 'https://invite.maisonmrkt.com'; // PLACEHOLDER_DOMAIN

  // ---- Refs ----
  const screens = {
    envelope: document.getElementById('envelope-screen'),
    invite:   document.getElementById('invite-screen'),
    rsvp:     document.getElementById('rsvp-screen'),
    confirm:  document.getElementById('confirm-screen'),
  };

  const envelopeStage = document.getElementById('envelope-stage');
  const rsvpBtn       = document.getElementById('rsvp-btn');
  const rsvpForm      = document.getElementById('rsvp-form');
  const shareBtn      = document.getElementById('share-btn');

  // ---- Helpers ----
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');

    // Stretch tickers to full viewport width
    if (name === 'invite') {
      requestAnimationFrame(resizeTickers);
    }

    // Scroll to top and unlock scroll for form
    window.scrollTo(0, 0);
    document.body.style.overflow = name === 'rsvp' ? 'auto' : 'hidden';
  }

  function getRef() {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref') || '';
  }

  function stripAtSign(handle) {
    return handle.replace(/^@/, '');
  }

  // ---- Envelope open ----
  function openEnvelope() {
    if (envelopeStage.classList.contains('opening')) return;
    envelopeStage.classList.add('opening');

    // Fade out the photo background
    const envBg = document.getElementById('envelope-bg');
    if (envBg) envBg.classList.add('hidden');

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Card rises out, then we transition to the invite screen
    // Timing: flap opens (0-0.7s) → card rises (0.25-1.25s) → envelope fades (0.7-1.3s)
    // Switch to invite screen once card is mostly risen
    const delay = prefersReduced ? 200 : 1400;

    setTimeout(() => showScreen('invite'), delay);
  }

  envelopeStage.addEventListener('click', openEnvelope);
  envelopeStage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });

  // ---- RSVP button ----
  rsvpBtn.addEventListener('click', () => showScreen('rsvp'));

  // ---- Form validation & submission ----
  function validateField(input) {
    let valid = true;
    const val = input.value.trim();

    if (!val) {
      valid = false;
    } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      valid = false;
    }

    input.classList.toggle('error', !valid);
    return valid;
  }

  rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('field-name');
    const igInput   = document.getElementById('field-ig');
    const emailInput = document.getElementById('field-email');

    const allValid = [nameInput, igInput, emailInput]
      .map(validateField)
      .every(Boolean);

    if (!allValid) return;

    const data = {
      name:      nameInput.value.trim(),
      instagram: stripAtSign(igInput.value.trim()),
      email:     emailInput.value.trim(),
      ref:       getRef(),
      timestamp: new Date().toISOString(),
    };

    // Log to console (always, for debugging)
    console.log('[RSVP Submission]', data);

    // Submit to endpoint if configured
    if (SUBMIT_ENDPOINT) {
      try {
        await fetch(SUBMIT_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(data),
        });
      } catch (err) {
        console.error('[RSVP Submit Error]', err);
      }
    }

    showScreen('confirm');
  });

  // Clear error on input
  rsvpForm.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => input.classList.remove('error'));
  });

  // ---- Share ----
  shareBtn.addEventListener('click', async () => {
    const ref = getRef();
    const shareUrl = ref
      ? `${INVITE_URL}?ref=${encodeURIComponent(ref)}`
      : INVITE_URL;

    const shareData = {
      title: 'You\'re Invited — Maison MRKT Creator Network',
      text: 'You should come to this — an exclusive evening for creators. RSVP here:',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error — fall through to clipboard
        if (err.name !== 'AbortError') {
          copyFallback(shareUrl);
        }
      }
    } else {
      copyFallback(shareUrl);
    }
  });

  function copyFallback(url) {
    navigator.clipboard.writeText(url).then(() => {
      shareBtn.textContent = 'Link copied!';
      setTimeout(() => {
        shareBtn.textContent = 'Send to a creator friend';
      }, 2000);
    }).catch(() => {
      // Last resort: prompt
      window.prompt('Copy this link:', url);
    });
  }

  // ---- Ticker full-width sizing ----
  function resizeTickers() {
    const wrap = document.querySelector('.ticker-wrap');
    if (!wrap || !wrap.parentElement) return;
    // Measure parent's left offset instead of the ticker itself
    var parentLeft = wrap.parentElement.getBoundingClientRect().left;
    wrap.style.width = window.innerWidth + 'px';
    wrap.style.marginLeft = -parentLeft + 'px';
  }

  window.addEventListener('resize', resizeTickers);

  // ---- Keyboard handling for iOS ----
  // Scroll inputs into view when focused (avoids keyboard overlap)
  document.querySelectorAll('#rsvp-form input').forEach(input => {
    input.addEventListener('focus', () => {
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });
  });

})();
