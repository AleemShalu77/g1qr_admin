// Membership Plans Management
(function () {
  "use strict";

  const API_BASE_URL = "/api";

  // State
  let plans = [];
  let priceBookCounter = 0;
  let featureCounter = 0;

  // DOM Elements
  const plansContainer = document.getElementById("plansContainer");
  const loadingState = document.getElementById("loadingState");
  const statusFilter = document.getElementById("statusFilter");

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

  // Format currency
  function formatCurrency(amountMinor, currency = "INR") {
    if (!amountMinor && amountMinor !== 0) return "-";
    const symbol =
      currency === "INR"
        ? "₹"
        : currency === "USD"
        ? "$"
        : currency === "EUR"
        ? "€"
        : currency;
    // INR uses paise (divide by 100), EUR/USD seem to use actual currency units
    const amount = currency === "INR" ? amountMinor : amountMinor;
    return (
      symbol +
      amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  // Load plans
  window.loadPlans = async function () {
    try {
      loadingState.style.display = "block";
      plansContainer.innerHTML = "";

      const isActive = statusFilter.value;
      let url = `${API_BASE_URL}/plans?isAdmin=true`;
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
      console.log("Plans response:", data);

      if (data.status === false) {
        throw new Error(data.error || "Failed to load plans");
      }

      plans = data.data || data.plans || [];
      renderPlans(plans);
    } catch (error) {
      console.error("Load plans error:", error);
      plansContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-red-400 mb-4">Failed to load plans: ${error.message}</p>
          <button onclick="loadPlans()" class="text-sm text-indigo-400 hover:text-indigo-300">Try again</button>
        </div>
      `;
    } finally {
      loadingState.style.display = "none";
    }
  };

  // Render plans
  function renderPlans(plansList) {
    if (!plansList || plansList.length === 0) {
      plansContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <p class="text-slate-400">No plans found</p>
        </div>
      `;
      return;
    }

    plansContainer.innerHTML = plansList
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((plan) => {
        const inrPrice = plan.priceBook?.find(
          (p) => p.region === "IN" && p.isActive
        );
        const price = inrPrice
          ? formatCurrency(inrPrice.amountMinor, inrPrice.currency)
          : "N/A";
        const duration = plan.durationDays
          ? `${plan.durationDays} days`
          : "N/A";

        return `
        <div class="bg-slate-900/50 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors ${
          plan.highlight ? "ring-2 ring-indigo-500/50" : ""
        }">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-bold text-white mb-1">${
                plan.name || plan.key
              }</h3>
              <p class="text-sm text-slate-400">${plan.key}</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" ${
                plan.isActive ? "checked" : ""
              } onchange="togglePlanStatus('${plan._id}', this.checked, this)">
              <span class="toggle-slider"></span>
            </label>
          </div>

          <!-- Price -->
          <div class="mb-4">
            <p class="text-3xl font-bold text-white mb-1">${price}</p>
            <p class="text-sm text-slate-400">${duration}</p>
          </div>

          <!-- Features -->
          <div class="mb-4">
            <p class="text-xs font-medium text-slate-500 uppercase mb-2">Features</p>
            <ul class="space-y-1.5">
              ${(plan.features || [])
                .slice(0, 3)
                .map(
                  (
                    f
                  ) => `<li class="text-sm text-slate-300 flex items-start gap-2">
                <svg class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>${f}</span>
              </li>`
                )
                .join("")}
              ${
                (plan.features || []).length > 3
                  ? `<li class="text-xs text-slate-500">+${
                      (plan.features || []).length - 3
                    } more</li>`
                  : ""
              }
            </ul>
          </div>

          <!-- Limits -->
          <div class="flex items-center gap-4 mb-4 text-xs text-slate-400">
            ${
              plan.limits?.histories
                ? `<span>Histories: ${plan.limits.histories}</span>`
                : ""
            }
            ${plan.limits?.docs ? `<span>Docs: ${plan.limits.docs}</span>` : ""}
          </div>

          <!-- Price Book -->
          <div class="mb-4 pt-4 border-t border-white/5">
            <p class="text-xs font-medium text-slate-500 uppercase mb-2">Pricing</p>
            <div class="space-y-1">
              ${(plan.priceBook || [])
                .filter((p) => p.isActive)
                .map(
                  (p) => `
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-400">${p.region}</span>
                  <span class="text-white font-medium">${formatCurrency(
                    p.amountMinor,
                    p.currency
                  )}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between pt-4 border-t border-white/5">
            <span class="text-xs text-slate-500">Sort: ${plan.sort || 0}</span>
            ${
              plan.highlight
                ? `<span class="px-2 py-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 rounded-lg">Featured</span>`
                : ""
            }
          </div>
        </div>
      `;
      })
      .join("");
  }

  // Add price book item
  window.addPriceBookItem = function () {
    const container = document.getElementById("priceBookContainer");
    const id = `priceBook_${priceBookCounter++}`;
    const item = document.createElement("div");
    item.className = "flex items-end gap-3 p-3 bg-slate-800/30 rounded-xl";
    item.innerHTML = `
      <div class="flex-1">
        <label class="block text-xs font-medium text-slate-400 mb-1">Region</label>
        <input type="text" name="priceBook_region" placeholder="IN, EU, US" required class="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm uppercase">
      </div>
      <div class="flex-1">
        <label class="block text-xs font-medium text-slate-400 mb-1">Currency</label>
        <input type="text" name="priceBook_currency" placeholder="INR, USD, EUR" required class="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm uppercase">
      </div>
      <div class="flex-1">
        <label class="block text-xs font-medium text-slate-400 mb-1">Amount</label>
        <input type="number" name="priceBook_amountMinor" placeholder="2599 or 25.33" required min="0" step="0.01" class="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm">
        <p class="text-xs text-slate-500 mt-0.5">INR: paise (2599=₹25.99), Others: actual</p>
      </div>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" name="priceBook_isActive" checked class="w-4 h-4 rounded border-slate-600 bg-slate-800/50 text-indigo-500">
          <span class="text-xs text-slate-400">Active</span>
        </label>
        <button type="button" onclick="this.closest('.flex').remove()" class="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
    container.appendChild(item);
  };

  // Add feature
  window.addFeature = function () {
    const container = document.getElementById("featuresContainer");
    const item = document.createElement("div");
    item.className = "flex items-center gap-2";
    item.innerHTML = `
      <input type="text" name="feature" placeholder="e.g., Unlimited QR items" class="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500">
      <button type="button" onclick="this.closest('.flex').remove()" class="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;
    container.appendChild(item);
  };

  // Open add modal
  window.openAddModal = function () {
    document.getElementById("modalTitle").textContent = "Add New Plan";
    document.getElementById("submitBtnText").textContent = "Create Plan";
    document.getElementById("planForm").reset();

    // Clear containers
    document.getElementById("priceBookContainer").innerHTML = "";
    document.getElementById("featuresContainer").innerHTML = "";

    // Add default price book items
    addPriceBookItem();

    document.getElementById("planModal").classList.add("active");
  };

  // Close modal
  window.closeModal = function () {
    document.getElementById("planModal").classList.remove("active");
  };

  // Handle form submit
  document
    .getElementById("planForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const submitBtn = document.getElementById("submitBtn");
      const submitBtnText = document.getElementById("submitBtnText");
      const submitBtnSpinner = document.getElementById("submitBtnSpinner");

      submitBtn.disabled = true;
      submitBtnText.textContent = "Creating...";
      submitBtnSpinner.classList.remove("hidden");

      try {
        // Build plan data
        const planData = {
          slug: document.getElementById("planSlug").value.toLowerCase().trim(),
          displayName: document.getElementById("planDisplayName").value.trim(),
          durationDays: parseInt(
            document.getElementById("planDurationDays").value
          ),
          highlight: document.getElementById("planHighlight").checked,
          isActive: document.getElementById("planIsActive").checked,
          sort: parseInt(document.getElementById("planSort").value) || 0,
        };

        // Price book
        const priceBookItems = Array.from(
          document.querySelectorAll('[name="priceBook_region"]')
        )
          .map((input, index) => {
            const container = input.closest(".flex");
            const currency = container
              .querySelector('[name="priceBook_currency"]')
              .value.toUpperCase()
              .trim();
            const amountValue = parseFloat(
              container.querySelector('[name="priceBook_amountMinor"]').value
            );
            // For INR, keep as integer (paise), for others keep as decimal
            const amountMinor =
              currency === "INR" ? Math.round(amountValue) : amountValue;
            return {
              region: input.value.toUpperCase().trim(),
              currency: currency,
              amountMinor: amountMinor,
              isActive: container.querySelector('[name="priceBook_isActive"]')
                .checked,
            };
          })
          .filter(
            (item) =>
              item.region &&
              item.currency &&
              (item.amountMinor || item.amountMinor === 0)
          );

        if (priceBookItems.length === 0) {
          throw new Error("At least one price book item is required");
        }
        planData.priceBook = priceBookItems;

        // Features
        const features = Array.from(
          document.querySelectorAll('[name="feature"]')
        )
          .map((input) => input.value.trim())
          .filter(Boolean);
        if (features.length > 0) {
          planData.features = features;
        }

        // Limits
        const historiesLimit =
          document.getElementById("planHistoriesLimit").value;
        const docsLimit = document.getElementById("planDocsLimit").value;
        if (historiesLimit || docsLimit) {
          planData.limits = {};
          if (historiesLimit)
            planData.limits.histories = parseInt(historiesLimit);
          if (docsLimit) planData.limits.docs = parseInt(docsLimit);
        }

        // Notes
        const notes = document.getElementById("planNotes").value.trim();
        if (notes) planData.notes = notes;

        console.log("Creating plan:", planData);

        const response = await fetch(`${API_BASE_URL}/plans`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(planData),
        });

        const data = await response.json();
        console.log("Create response:", data);

        if (data.status === false || !response.ok) {
          throw new Error(
            data.error || data.message || "Failed to create plan"
          );
        }

        showToast("success", "Success", "Plan created successfully");
        closeModal();
        loadPlans();
      } catch (error) {
        console.error("Create plan error:", error);
        showToast("error", "Error", error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtnText.textContent = "Create Plan";
        submitBtnSpinner.classList.add("hidden");
      }
    });

  // Toggle plan status
  window.togglePlanStatus = async function (planId, isActive, checkbox) {
    checkbox.disabled = true;

    try {
      const response = await fetch(
        `${API_BASE_URL}/plans/${planId}/toggle-active`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
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
        `Plan ${isActive ? "activated" : "deactivated"}`
      );
    } catch (error) {
      console.error("Toggle error:", error);
      showToast("error", "Error", error.message);
      checkbox.checked = !isActive;
    } finally {
      checkbox.disabled = false;
    }
  };

  // Initialize
  loadPlans();
})();
