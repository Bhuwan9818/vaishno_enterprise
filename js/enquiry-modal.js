/* =========================================================
   Shri Vaishno Enterprises — Product Enquiry Modal
   Opens instantly on any "Enquire" click, pre-fills the
   product, and submits to the PHP backend via AJAX
   (no page reload — data is stored in MySQL and emailed
   to the admin + a confirmation copy to the customer).

   Requires: window.ENQUIRY_API to be set on the page
   (path to backend/submit_enquiry.php, relative to that page)
   ========================================================= */
(function () {
  'use strict';

  var API = window.ENQUIRY_API || 'backend/submit_enquiry.php';

  /* ---------- build & inject the modal markup once ---------- */
  var overlay = document.createElement('div');
  overlay.className = 'enq-overlay';
  overlay.id = 'enqOverlay';
  overlay.innerHTML =
    "<div class='enq-modal' role='dialog' aria-modal='true' aria-labelledby='enqTitle'>" +
      "<div class='enq-head'>" +
        "<button type='button' class='enq-close' id='enqClose' aria-label='Close'>&times;</button>" +
        "<div class='enq-eyebrow'>Product Enquiry</div>" +
        "<h3 class='enq-title' id='enqTitle'>Send Your Enquiry</h3>" +
        "<div class='enq-product-pill' id='enqProductPill'>" +
          "<span class='enq-product-name' id='enqProductName'></span>" +
          "<span class='enq-product-price' id='enqProductPrice'></span>" +
        "</div>" +
      "</div>" +
      "<div class='enq-body'>" +
        "<div class='enq-status' id='enqStatus'></div>" +
        "<form id='enqForm' novalidate>" +
          "<input type='text' name='company' class='enq-hp' tabindex='-1' autocomplete='off'/>" +
          "<input type='hidden' name='product_name' id='enqFieldProduct'/>" +
          "<input type='hidden' name='product_price' id='enqFieldPrice'/>" +
          "<input type='hidden' name='source_page' id='enqFieldSource'/>" +
          "<div class='frow'>" +
            "<div class='fg'><label>Full Name *</label><input type='text' name='name' id='enqName' placeholder='Your name' required/></div>" +
            "<div class='fg'><label>Phone Number *</label><input type='tel' name='phone' id='enqPhone' placeholder='+91 XXXXX XXXXX' required/></div>" +
          "</div>" +
          "<div class='fg'><label>Email Address</label><input type='email' name='email' id='enqEmail' placeholder='your@email.com'/></div>" +
          "<div class='fg'><label>Message</label><textarea name='message' id='enqMessage' placeholder='Your production target, location, budget or specific requirement&hellip;'></textarea></div>" +
          "<button type='submit' class='enq-submit' id='enqSubmitBtn'><span class='enq-spin'></span><span id='enqSubmitLabel'>Send Enquiry &rarr;</span></button>" +
        "</form>" +
        "<div class='enq-success' id='enqSuccess' style='display:none'>" +
          "<div class='enq-success-ico'>&#10003;</div>" +
          "<h4>Enquiry Received!</h4>" +
          "<p>Thank you &mdash; our team will contact you within 24 hours with pricing and availability.</p>" +
          "<button type='button' class='btnink' id='enqDoneBtn'>Close</button>" +
        "</div>" +
      "</div>" +
    "</div>";
  document.body.appendChild(overlay);

  var form = document.getElementById('enqForm');
  var successBox = document.getElementById('enqSuccess');
  var statusBox = document.getElementById('enqStatus');
  var submitBtn = document.getElementById('enqSubmitBtn');
  var submitLabel = document.getElementById('enqSubmitLabel');

  /* ---------- open / close ---------- */
  function openModal(productName, productPrice) {
    document.getElementById('enqProductName').textContent = productName || 'General Enquiry';
    document.getElementById('enqProductPrice').textContent = productPrice || '';
    document.getElementById('enqFieldProduct').value = productName || 'General Enquiry';
    document.getElementById('enqFieldPrice').value = productPrice || '';
    document.getElementById('enqFieldSource').value = window.location.href;
    document.getElementById('enqProductPill').style.display = productName ? 'inline-flex' : 'none';

    form.reset();
    document.getElementById('enqFieldProduct').value = productName || 'General Enquiry';
    document.getElementById('enqFieldPrice').value = productPrice || '';
    document.getElementById('enqFieldSource').value = window.location.href;
    form.style.display = 'block';
    successBox.style.display = 'none';
    statusBox.className = 'enq-status';
    statusBox.textContent = '';

    overlay.classList.add('on');
    document.body.classList.add('enq-open');
    setTimeout(function () { document.getElementById('enqName').focus(); }, 260);
  }

  function closeModal() {
    overlay.classList.remove('on');
    document.body.classList.remove('enq-open');
  }

  document.getElementById('enqClose').addEventListener('click', closeModal);
  document.getElementById('enqDoneBtn').addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('on')) closeModal(); });

  window.openEnquiryModal = openModal;

  /* ---------- form submit (AJAX, no reload) ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = document.getElementById('enqName').value.trim();
    var phone = document.getElementById('enqPhone').value.trim();
    var email = document.getElementById('enqEmail').value.trim();

    statusBox.className = 'enq-status';
    statusBox.textContent = '';

    if (!name || !phone) {
      statusBox.className = 'enq-status err';
      statusBox.textContent = 'Please enter your name and phone number.';
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      statusBox.className = 'enq-status err';
      statusBox.textContent = 'Please enter a valid email address.';
      return;
    }

    var fd = new FormData(form);
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitLabel.textContent = 'Sending&hellip;';

    fetch(API, { method: 'POST', body: fd, headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.json().catch(function () { throw new Error('bad-json'); }); })
      .then(function (data) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitLabel.textContent = 'Send Enquiry \u2192';

        if (data && data.success) {
          form.style.display = 'none';
          successBox.style.display = 'block';
        } else {
          statusBox.className = 'enq-status err';
          statusBox.textContent = (data && data.message) || 'Something went wrong. Please try again or call us directly.';
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitLabel.textContent = 'Send Enquiry \u2192';
        statusBox.className = 'enq-status err';
        statusBox.textContent = 'Could not reach the server. Please check your connection or call us directly at +91 98990 57451.';
      });
  });

  /* ---------- auto-wire every ".js-enquire" trigger on the page ---------- */
  function textOf(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

  function priceFromPdBox() {
    var box = document.querySelector('.pd-price-amt');
    if (!box) return '';
    var clone = box.cloneNode(true);
    var span = clone.querySelector('span');
    if (span) span.parentNode.removeChild(span);
    return textOf(clone);
  }

  function handleTrigger(el) {
    // 1) explicit data attributes always win
    if (el.hasAttribute('data-product')) {
      openModal(el.getAttribute('data-product'), el.getAttribute('data-price') || '');
      return;
    }
    // 2) nearest product card on listing/grid pages
    var card = el.closest('.pcard');
    if (card) {
      var pname = textOf(card.querySelector('.pname'));
      var pprice = textOf(card.querySelector('.pprice')) || textOf(card.querySelector('.preq'));
      openModal(pname, pprice);
      return;
    }
    // 3) single product detail page
    var pdTitle = document.querySelector('.pd-title');
    if (pdTitle) {
      openModal(textOf(pdTitle), priceFromPdBox());
      return;
    }
    // 4) fallback — general enquiry
    openModal('', '');
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.js-enquire');
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();
    handleTrigger(trigger);
  });
})();
