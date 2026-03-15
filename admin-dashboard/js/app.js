/* ============================================================
   CUBECOMM ADMIN — Main Application Script
   ============================================================ */

$(function () {

  /* ── Page Registry ── */
  const pageFiles = {
    'dashboard':        'pages/dashboard.html',
    'products':         'pages/products.html',
    'product-details':  'pages/product-details.html',
    'product-create':   'pages/product-create.html',
    'categories':       'pages/categories.html',
    'orders':           'pages/orders.html',
    'order-details':    'pages/order-details.html',
    'customers':        'pages/customers.html',
    'customer-profile': 'pages/customer-profile.html',
    'profile':          'pages/profile.html',
  };

  /* ── State ── */
  let currentPage = null;
  let sidebarCollapsed = false;

  /* ── Loader ── */
  function showLoader() {
    $('#pageContent').html(`
      <div class="page-loader">
        <div class="loader-spinner"></div>
        <span>Loading…</span>
      </div>
    `);
  }

  /* ── Load Page ── */
  window.loadPage = function (page) {
    if (!pageFiles[page]) return;
    if (currentPage === page) return;
    currentPage = page;

    // Update nav highlight
    $('.sidebar-nav .nav-link').removeClass('active');
    const mainPage = page.split('-')[0];
    $(`.sidebar-nav .nav-link[data-page="${page}"], .sidebar-nav .nav-link[data-page="${mainPage}"]`).first().addClass('active');

    showLoader();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile sidebar
    if ($(window).width() < 992) {
      closeMobileSidebar();
    }

    $.ajax({
      url: pageFiles[page],
      method: 'GET',
      success: function (html) {
        $('#pageContent').html(html);
        // Re-init any Bootstrap tooltips/etc
        initPageExtras();
      },
      error: function () {
        $('#pageContent').html(`
          <div class="empty-state" style="margin-top:80px;">
            <i class="fa-solid fa-circle-exclamation"></i>
            <h5>Page not found</h5>
            <p>Could not load the requested page. Make sure all page files are in the <code>pages/</code> directory.</p>
          </div>
        `);
      }
    });
  };

  /* ── Init page extras (re-bind after load) ── */
  function initPageExtras() {
    // Bind all nav-link data-page within content
    $('#pageContent').on('click', '[data-page]', function (e) {
      e.preventDefault();
      loadPage($(this).data('page'));
    });
  }

  /* ── Sidebar Toggle (desktop: collapse icons-only) ── */
  function toggleSidebar() {
    if ($(window).width() >= 992) {
      sidebarCollapsed = !sidebarCollapsed;
      $('#sidebar').toggleClass('collapsed', sidebarCollapsed);
      if (sidebarCollapsed) {
        $('#mainWrapper').css('margin-left', 'var(--sidebar-collapsed)');
      } else {
        $('#mainWrapper').css('margin-left', 'var(--sidebar-width)');
      }
    } else {
      openMobileSidebar();
    }
  }

  function openMobileSidebar() {
    $('#sidebar').addClass('mobile-open');
    $('#sidebarOverlay').addClass('show');
    $('body').css('overflow', 'hidden');
  }

  function closeMobileSidebar() {
    $('#sidebar').removeClass('mobile-open');
    $('#sidebarOverlay').removeClass('show');
    $('body').css('overflow', '');
  }

  $('#sidebarToggle').click(toggleSidebar);
  $('#sidebarCloseBtn').click(closeMobileSidebar);
  $('#sidebarOverlay').click(closeMobileSidebar);

  /* ── Sidebar nav clicks ── */
  $(document).on('click', '.sidebar-nav .nav-link', function (e) {
    e.preventDefault();
    loadPage($(this).data('page'));
  });

  /* ── Topbar dropdown nav clicks ── */
  $(document).on('click', '.admin-dropdown .dropdown-item[data-page]', function (e) {
    e.preventDefault();
    loadPage($(this).data('page'));
  });

  /* ── Global search keyboard shortcut ── */
  $(document).keydown(function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      $('#globalSearch').focus().select();
    }
  });

  /* ── Tooltip labels for collapsed sidebar ── */
  function setSidebarTooltips() {
    const labels = {
      'dashboard': 'Dashboard',
      'products': 'Products',
      'categories': 'Categories',
      'orders': 'Orders',
      'customers': 'Customers',
      'profile': 'Profile',
    };
    $('.sidebar-nav .nav-link').each(function () {
      const page = $(this).data('page');
      if (labels[page]) $(this).attr('data-tooltip', labels[page]);
    });
  }
  setSidebarTooltips();

  /* ── Responsive: reset sidebar on resize ── */
  $(window).on('resize', function () {
    if ($(this).width() >= 992) {
      closeMobileSidebar();
      $('#mainWrapper').css('margin-left', sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)');
    }
  });

  /* ================================================================
     GLOBAL UTILITY: Pagination renderer
     renderPagination(containerSelector, totalItems, currentPage, perPage, callback)
  ================================================================ */
  window.renderPagination = function (selector, total, current, perPage, callback) {
    const totalPages = Math.ceil(total / perPage);
    const container = $(selector);
    container.empty();

    if (totalPages <= 1) return;

    const start = (current - 1) * perPage + 1;
    const end = Math.min(current * perPage, total);

    let html = `<span class="pagination-info">Showing ${start}–${end} of ${total}</span>`;
    html += `<div class="pagination-btns">`;
    html += `<button class="page-btn" ${current === 1 ? 'disabled' : ''} data-pg="${current - 1}"><i class="fa-solid fa-chevron-left fa-xs"></i></button>`;

    // Determine visible pages
    let pages = [];
    if (totalPages <= 5) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pages = [1];
      if (current > 3) pages.push('…');
      for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) pages.push(i);
      if (current < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }

    pages.forEach(p => {
      if (p === '…') {
        html += `<button class="page-btn" disabled>…</button>`;
      } else {
        html += `<button class="page-btn ${p === current ? 'active' : ''}" data-pg="${p}">${p}</button>`;
      }
    });

    html += `<button class="page-btn" ${current === totalPages ? 'disabled' : ''} data-pg="${current + 1}"><i class="fa-solid fa-chevron-right fa-xs"></i></button>`;
    html += `</div>`;

    container.html(html);

    // Bind events
    container.find('.page-btn[data-pg]').click(function () {
      const pg = parseInt($(this).data('pg'));
      if (!isNaN(pg) && pg !== current) {
        callback(pg);
      }
    });
  };

  /* ── Boot: load dashboard ── */
  loadPage('dashboard');
});
