// Coupons Management
(function () {
  "use strict";

  // Use local proxy API (server handles auth token from cookie)
  const API_BASE_URL = "/api";

  // State
  let currentPage = 1;
  const limit = 20;
  let totalPages = 1;
  let totalCoupons = 0;
  let couponToDelete = null;

  // DOM Elements
  const couponsTableBody = document.getElementById("couponsTableBody");
  const statusFilter = document.getElementById("statusFilter");
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
    });
  }

  // Format currency
  function formatCurrency(minor) {
    if (!minor) return "-";
    return "₹" + (minor / 100).toLocaleString("en-IN");
  }

  // Load coupons
  window.loadCoupons = async function () {
    try {
      // Show loading
      couponsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-5 py-8 text-center">
            <div class="flex items-center justify-center gap-3">
              <div class="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <span class="text-slate-400">Loading coupons...</span>
            </div>
          </td>
        </tr>
      `;

      const isActive = statusFilter.value;
      let url = `${API_BASE_URL}/coupons?page=${currentPage}&limit=${limit}`;
      if (isActive) {
        url += `&isActive=${isActive}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Coupons response:", data);

      if (data.status === false) {
        throw new Error(data.error || "Failed to load coupons");
      }

      // API returns: { items: [...], total: N, pages: N }
      const coupons = data.items || data.data || data.coupons || [];
      totalCoupons = data.total || coupons.length;
      totalPages = data.pages || Math.ceil(totalCoupons / limit) || 1;

      renderCoupons(coupons);
      updatePagination();
    } catch (error) {
      console.error("Load coupons error:", error);
      couponsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-5 py-8 text-center">
            <p class="text-red-400">Failed to load coupons: ${error.message}</p>
            <button onclick="loadCoupons()" class="mt-2 text-sm text-indigo-400 hover:text-indigo-300">Try again</button>
          </td>
        </tr>
      `;
    }
  };

  // Render coupons table
  function renderCoupons(coupons) {
    if (!coupons || coupons.length === 0) {
      couponsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-5 py-8 text-center">
            <div class="text-slate-400">
              <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
              <p>No coupons found</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    couponsTableBody.innerHTML = coupons
      .map(
        (coupon) => `
      <tr class="hover:bg-white/[0.02] transition-colors">
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
              </svg>
            </div>
            <div>
              <p class="text-white font-medium">${coupon.code}</p>
              <p class="text-xs text-slate-500">${
                coupon.notes || "No notes"
              }</p>
            </div>
          </div>
        </td>
        <td class="px-5 py-4">
          <span class="px-2 py-1 text-xs font-medium rounded-lg ${
            coupon.type === "percent"
              ? "text-purple-400 bg-purple-500/10"
              : "text-emerald-400 bg-emerald-500/10"
          }">
            ${coupon.type === "percent" ? "Percentage" : "Fixed"}
          </span>
        </td>
        <td class="px-5 py-4">
          <p class="text-white font-medium">
            ${
              coupon.type === "percent"
                ? coupon.value + "%"
                : formatCurrency(coupon.value * 100)
            }
          </p>
          ${
            coupon.maxDiscountMinor
              ? `<p class="text-xs text-slate-500">Max: ${formatCurrency(
                  coupon.maxDiscountMinor
                )}</p>`
              : ""
          }
        </td>
        <td class="px-5 py-4">
          <p class="text-white">${coupon.usedCount || 0} / ${
          coupon.usageLimit || "∞"
        }</p>
          <p class="text-xs text-slate-500">Per user: ${
            coupon.perUserLimit || "∞"
          }</p>
        </td>
        <td class="px-5 py-4">
          <p class="text-sm text-white">${formatDate(coupon.startsAt)}</p>
          <p class="text-xs text-slate-500">to ${formatDate(coupon.endsAt)}</p>
        </td>
        <td class="px-5 py-4">
          <label class="toggle-switch">
            <input type="checkbox" ${
              coupon.isActive ? "checked" : ""
            } onchange="toggleCouponStatus('${
          coupon._id
        }', this.checked, this)">
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td class="px-5 py-4">
          <button onclick="openDeleteModal('${coupon._id}', '${
          coupon.code
        }')" class="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  // Update pagination
  function updatePagination() {
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalCoupons);

    paginationInfo.textContent = `Showing ${
      totalCoupons > 0 ? start : 0
    }-${end} of ${totalCoupons} coupons`;
    pageInfo.textContent = currentPage;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  // Change page
  window.changePage = function (delta) {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    loadCoupons();
  };

  // Open add modal
  window.openAddModal = function () {
    document.getElementById("modalTitle").textContent = "Add New Coupon";
    document.getElementById("submitBtnText").textContent = "Create Coupon";
    document.getElementById("couponForm").reset();

    // Set default dates
    const now = new Date();
    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
    document.getElementById("startsAt").value = now.toISOString().slice(0, 16);
    document.getElementById("endsAt").value = nextMonth
      .toISOString()
      .slice(0, 16);

    document.getElementById("couponModal").classList.add("active");
  };

  // Close modal
  window.closeModal = function () {
    document.getElementById("couponModal").classList.remove("active");
  };

  // Handle form submit
  document
    .getElementById("couponForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const submitBtn = document.getElementById("submitBtn");
      const submitBtnText = document.getElementById("submitBtnText");
      const submitBtnSpinner = document.getElementById("submitBtnSpinner");

      // Disable button
      submitBtn.disabled = true;
      submitBtnText.textContent = "Creating...";
      submitBtnSpinner.classList.remove("hidden");

      try {
        // Build coupon data
        const couponData = {
          code: document
            .getElementById("couponCode")
            .value.toUpperCase()
            .trim(),
          type: document.getElementById("couponType").value,
          value: parseInt(document.getElementById("couponValue").value),
          startsAt: new Date(
            document.getElementById("startsAt").value
          ).toISOString(),
          endsAt: new Date(
            document.getElementById("endsAt").value
          ).toISOString(),
        };

        // Optional fields
        const maxDiscount = document.getElementById("maxDiscountMinor").value;
        if (maxDiscount) couponData.maxDiscountMinor = parseInt(maxDiscount);

        const regions = document.getElementById("couponRegions").value;
        if (regions) {
          couponData.regions = regions
            .split(",")
            .map((r) => r.trim().toUpperCase())
            .filter(Boolean);
        }

        const usageLimit = document.getElementById("usageLimit").value;
        if (usageLimit) couponData.usageLimit = parseInt(usageLimit);

        const perUserLimit = document.getElementById("perUserLimit").value;
        if (perUserLimit) couponData.perUserLimit = parseInt(perUserLimit);

        const notes = document.getElementById("couponNotes").value;
        if (notes) couponData.notes = notes.trim();

        console.log("Creating coupon:", couponData);

        const response = await fetch(`${API_BASE_URL}/coupons`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(couponData),
        });

        const data = await response.json();
        console.log("Create response:", data);

        if (data.status === false || !response.ok) {
          throw new Error(
            data.error || data.message || "Failed to create coupon"
          );
        }

        showToast("success", "Success", "Coupon created successfully");
        closeModal();
        loadCoupons();
      } catch (error) {
        console.error("Create coupon error:", error);
        showToast("error", "Error", error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtnText.textContent = "Create Coupon";
        submitBtnSpinner.classList.add("hidden");
      }
    });

  // Toggle coupon status
  window.toggleCouponStatus = async function (couponId, isActive, checkbox) {
    checkbox.disabled = true;

    try {
      const response = await fetch(
        `${API_BASE_URL}/coupons/${couponId}/toggle`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ isActive }),
        }
      );

      const data = await response.json();
      console.log("Toggle response:", data);

      if (data.status === false || !response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      showToast(
        "success",
        "Success",
        `Coupon ${isActive ? "activated" : "deactivated"}`
      );
    } catch (error) {
      console.error("Toggle error:", error);
      showToast("error", "Error", error.message);
      // Revert checkbox
      checkbox.checked = !isActive;
    } finally {
      checkbox.disabled = false;
    }
  };

  // Open delete modal
  window.openDeleteModal = function (couponId, couponCode) {
    couponToDelete = couponId;
    document.getElementById("deleteCouponCode").textContent = couponCode;
    document.getElementById("deleteModal").classList.add("active");
  };

  // Close delete modal
  window.closeDeleteModal = function () {
    couponToDelete = null;
    document.getElementById("deleteModal").classList.remove("active");
  };

  // Confirm delete
  window.confirmDelete = async function () {
    if (!couponToDelete) return;

    const deleteBtn = document.getElementById("confirmDeleteBtn");
    const deleteBtnText = document.getElementById("deleteBtnText");
    const deleteBtnSpinner = document.getElementById("deleteBtnSpinner");

    deleteBtn.disabled = true;
    deleteBtnText.textContent = "Deleting...";
    deleteBtnSpinner.classList.remove("hidden");

    try {
      const response = await fetch(
        `${API_BASE_URL}/coupons/${couponToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      console.log("Delete response:", data);

      if (data.status === false || !response.ok) {
        throw new Error(data.error || "Failed to delete coupon");
      }

      showToast("success", "Success", "Coupon deleted successfully");
      closeDeleteModal();
      loadCoupons();
    } catch (error) {
      console.error("Delete error:", error);
      showToast("error", "Error", error.message);
    } finally {
      deleteBtn.disabled = false;
      deleteBtnText.textContent = "Delete";
      deleteBtnSpinner.classList.add("hidden");
    }
  };

  // Initialize
  loadCoupons();
})();
