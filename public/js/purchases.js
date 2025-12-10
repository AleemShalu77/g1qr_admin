// Membership Purchases Management
(function () {
  "use strict";

  const API_BASE_URL = "/api";

  // State
  let currentPage = 1;
  const limit = 10;
  let totalPages = 1;
  let totalPurchases = 0;
  let allPurchases = [];
  let searchTerm = "";

  // DOM Elements
  const purchasesTableBody = document.getElementById("purchasesTableBody");
  const loadingRow = document.getElementById("loadingRow");
  const paymentFilter = document.getElementById("paymentFilter");
  const membershipFilter = document.getElementById("membershipFilter");
  const searchInput = document.getElementById("searchInput");
  const paginationInfo = document.getElementById("paginationInfo");
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  // Toast functions
  window.showToast = function (type, title, message) {
    const toast = document.getElementById("toast");
    const toastContent = document.getElementById("toast-content");
    const toastIcon = document.getElementById("toast-icon");
    const toastTitle = document.getElementById("toast-title");
    const toastMessage = document.getElementById("toast-message");

    toastTitle.textContent = title;
    toastMessage.textContent = message;

    if (type === "error") {
      toastContent.className =
        "rounded-2xl p-4 shadow-2xl flex items-start gap-3 border backdrop-blur-xl bg-red-500/90 border-red-400/20 text-white";
      toastIcon.innerHTML =
        '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    } else if (type === "success") {
      toastContent.className =
        "rounded-2xl p-4 shadow-2xl flex items-start gap-3 border backdrop-blur-xl bg-emerald-500/90 border-emerald-400/20 text-white";
      toastIcon.innerHTML =
        '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    }

    toast.classList.add("show");
    setTimeout(hideToast, 5000);
  };

  window.hideToast = function () {
    document.getElementById("toast").classList.remove("show");
  };

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Format date for validity (date only, cleaner format)
  function formatValidityDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    const day = date.getDate();
    const month = date.toLocaleDateString("en-IN", { month: "short" });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    
    return {
      date: `${day} ${month}`,
      year: year,
      time: `${displayHours}:${displayMinutes} ${ampm}`
    };
  }

  // Format currency
  function formatCurrency(amount, currency = "INR") {
    if (!amount && amount !== 0) return "-";
    const symbol =
      currency === "INR"
        ? "₹"
        : currency === "USD"
        ? "$"
        : currency === "EUR"
        ? "€"
        : currency;
    // Amounts are already in currency format (e.g., "25.99", "1300.00")
    const numAmount = parseFloat(amount);
    return symbol + numAmount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // Check if membership is expired
  function isExpired(expiresAt) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  // Load purchases
  window.loadPurchases = async function () {
    try {
      // Show loading
      purchasesTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="px-5 py-8 text-center">
            <div class="flex items-center justify-center gap-3">
              <div class="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <span class="text-slate-400">Loading purchases...</span>
            </div>
          </td>
        </tr>
      `;

      const response = await fetch(
        `${API_BASE_URL}/purchases?page=${currentPage}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      console.log("Purchases response:", data);

      if (data.status === false) {
        throw new Error(data.error || "Failed to load purchases");
      }

      allPurchases = data.data || [];
      totalPurchases = data.pagination?.totalItems || allPurchases.length;
      totalPages = data.pagination?.totalPages || 1;

      // Apply filters
      let filteredPurchases = allPurchases;

      // Payment filter
      const paymentStatus = paymentFilter.value;
      if (paymentStatus) {
        const isPaid = paymentStatus === "true";
        filteredPurchases = filteredPurchases.filter(
          (p) => p.payment?.paid === isPaid
        );
      }

      // Membership status filter
      const membershipStatus = membershipFilter.value;
      if (membershipStatus) {
        const isActive = membershipStatus === "true";
        filteredPurchases = filteredPurchases.filter((p) => {
          const expired = isExpired(p.dates?.expiresAt);
          return isActive ? !expired : expired;
        });
      }

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredPurchases = filteredPurchases.filter(
          (p) =>
            p.profileName?.toLowerCase().includes(term) ||
            p.username?.toLowerCase().includes(term) ||
            p.plan?.name?.toLowerCase().includes(term)
        );
      }

      renderPurchases(filteredPurchases);
      updatePagination(filteredPurchases.length);
    } catch (error) {
      console.error("Load purchases error:", error);
      purchasesTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="px-5 py-8 text-center">
            <p class="text-red-400">Failed to load purchases: ${error.message}</p>
            <button onclick="loadPurchases()" class="mt-2 text-sm text-indigo-400 hover:text-indigo-300">Try again</button>
          </td>
        </tr>
      `;
    }
  };

  // Render purchases table
  function renderPurchases(purchases) {
    if (!purchases || purchases.length === 0) {
      purchasesTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="px-5 py-8 text-center">
            <div class="text-slate-400">
              <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              <p>No purchases found</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    purchasesTableBody.innerHTML = purchases
      .map((purchase) => {
        const expired = isExpired(purchase.dates?.expiresAt);
        const avatarUrl = purchase.avatar
          ? purchase.avatar.replace(/\\/g, "/")
          : null;

        return `
      <tr class="hover:bg-white/[0.02] transition-colors">
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden">
              ${
                avatarUrl
                  ? `<img src="${avatarUrl}" alt="${purchase.profileName}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="w-full h-full items-center justify-center hidden">${(purchase.profileName || "U").charAt(0).toUpperCase()}</div>`
                  : (purchase.profileName || "U").charAt(0).toUpperCase()
              }
            </div>
            <div>
              <p class="text-white font-medium text-sm">${purchase.profileName || "Unknown"}</p>
              <p class="text-xs text-slate-500">@${purchase.username || "N/A"}</p>
            </div>
          </div>
        </td>
        <td class="px-5 py-4">
          <div>
            <p class="text-white font-medium">${purchase.plan?.name || "N/A"}</p>
            <p class="text-xs text-slate-500">${purchase.plan?.slug || ""}</p>
            ${purchase.coupon ? `<span class="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-amber-400 bg-amber-500/10 rounded">${purchase.coupon}</span>` : ""}
          </div>
        </td>
        <td class="px-5 py-4">
          <div>
            <p class="text-white font-medium">${formatCurrency(purchase.pricing?.finalPrice, purchase.pricing?.currency)}</p>
            ${purchase.pricing?.discount && parseFloat(purchase.pricing.discount) > 0 ? `
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-slate-500 line-through">${formatCurrency(purchase.pricing.basePrice, purchase.pricing.currency)}</span>
                <span class="text-xs text-emerald-400">-${formatCurrency(purchase.pricing.discount, purchase.pricing.currency)}</span>
              </div>
            ` : ""}
          </div>
        </td>
        <td class="px-5 py-4">
          <div>
            <p class="text-sm text-white">${purchase.payment?.provider || "N/A"}</p>
            <p class="text-xs text-slate-500 font-mono">${purchase.payment?.providerRef || ""}</p>
            <span class="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
              purchase.payment?.paid
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-red-400 bg-red-500/10"
            }">
              ${purchase.payment?.paid ? "Paid" : "Unpaid"}
            </span>
          </div>
        </td>
        <td class="px-5 py-4">
          <div class="purchases-validity-cell">
            ${(() => {
              const purchased = formatValidityDate(purchase.dates?.purchasedAt);
              const expires = formatValidityDate(purchase.dates?.expiresAt);
              if (!purchased || !expires) return "-";
              return `
                <div class="purchases-validity-main">
                  ${purchased.date} ${purchased.year}, ${purchased.time}
                </div>
                <div class="purchases-validity-expires">
                  <span class="purchases-validity-expires-label">Expires:</span> ${expires.date} ${expires.year}, ${expires.time}
                </div>
              `;
            })()}
          </div>
        </td>
        <td class="px-5 py-4">
          <span class="px-2 py-1 text-xs font-medium rounded-lg ${
            expired
              ? "text-red-400 bg-red-500/10"
              : purchase.membership?.isActive
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-slate-400 bg-slate-500/10"
          }">
            ${expired ? "Expired" : purchase.membership?.isActive ? "Active" : "Inactive"}
          </span>
        </td>
      </tr>
    `;
      })
      .join("");
  }

  // Update pagination
  function updatePagination(filteredCount) {
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, filteredCount);

    paginationInfo.textContent = `Showing ${filteredCount > 0 ? start : 0}-${end} of ${filteredCount} purchases`;
    pageInfo.textContent = currentPage;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  // Change page
  window.changePage = function (delta) {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    loadPurchases();
  };

  // Handle search
  window.handleSearch = function (e) {
    if (e.key === "Enter" || e.type === "keyup") {
      searchTerm = searchInput.value.trim();
      currentPage = 1; // Reset to first page on search
      loadPurchases();
    }
  };

  // Initialize
  loadPurchases();
})();

