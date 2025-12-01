// QR Codes Management
(function () {
  "use strict";

  const API_BASE_URL = "/api";

  // State
  let currentPage = 1;
  const limit = 20;
  let totalPages = 1;
  let totalItems = 0;
  let selectedBatch = "";
  let searchTerm = "";

  // DOM Elements
  const qrcodesContainer = document.getElementById("qrcodesContainer");
  const loadingState = document.getElementById("loadingState");
  const batchFilter = document.getElementById("batchFilter");
  const searchInput = document.getElementById("searchInput");
  const paginationInfo = document.getElementById("paginationInfo");
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const generateModal = document.getElementById("generateModal");
  const exportBtn = document.getElementById("exportBtn");

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
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "-";
    }
  }

  // Load QR batches for dropdown
  async function loadBatches() {
    try {
      const response = await fetch(`${API_BASE_URL}/qr-batches`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Batches response:", data);

      if (data.status === false) {
        throw new Error(data.error || "Failed to load batches");
      }

      const batches = data.data || data.batches || [];
      
      // Clear existing options except "All Batches"
      batchFilter.innerHTML = '<option value="">All Batches</option>';
      
      // Add batch options (using label as value for API call)
      batches.forEach((batch) => {
        const option = document.createElement("option");
        // Use label (batch code) as value since API expects batch_code
        const batchCode = batch.label || batch.batch_code || batch.code || batch;
        option.value = batchCode;
        option.textContent = batchCode;
        batchFilter.appendChild(option);
      });
    } catch (error) {
      console.error("Load batches error:", error);
      showToast("error", "Error", "Failed to load batches");
    }
  }

  // Load QR codes
  window.loadQRCodes = async function () {
    // Don't call API if no batch or search term is provided
    if (!selectedBatch && !searchTerm) {
      qrcodesContainer.innerHTML = `
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
          </svg>
          <p class="text-slate-400 mb-2">Select a batch or search by QR Code ID</p>
          <p class="text-xs text-slate-500">Choose a batch from the dropdown above or enter a QR Code ID to view codes</p>
        </div>
      `;
      paginationInfo.textContent = "Showing 0 of 0 QR codes";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    try {
      loadingState.style.display = "block";
      qrcodesContainer.innerHTML = "";

      let endpoint = `${API_BASE_URL}/qrcodes?page=${currentPage}&limit=${limit}`;
      
      if (selectedBatch) {
        endpoint += `&batch_code=${encodeURIComponent(selectedBatch)}`;
      }
      
      if (searchTerm) {
        endpoint += `&qr_code_id=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("QR codes response:", data);

      if (data.status === false) {
        throw new Error(data.error || "Failed to load QR codes");
      }

      const qrcodes = data.data || data.items || data.qrcodes || [];
      totalItems = data.pagination?.totalItems || data.total || qrcodes.length;
      totalPages = data.pagination?.totalPages || Math.ceil(totalItems / limit) || 1;

      renderQRCodes(qrcodes);
      updatePagination();
    } catch (error) {
      console.error("Load QR codes error:", error);
      qrcodesContainer.innerHTML = `
        <div class="text-center py-12">
          <p class="text-red-400 mb-4">Failed to load QR codes: ${error.message}</p>
          <button onclick="loadQRCodes()" class="text-sm text-indigo-400 hover:text-indigo-300">Try again</button>
        </div>
      `;
    } finally {
      loadingState.style.display = "none";
    }
  };

  // Render QR codes
  function renderQRCodes(qrcodes) {
    if (!qrcodes || qrcodes.length === 0) {
      qrcodesContainer.innerHTML = `
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
          </svg>
          <p class="text-slate-400">No QR codes found</p>
        </div>
      `;
      return;
    }

    qrcodesContainer.innerHTML = qrcodes
      .map((qr) => {
        const batch = qr.batch || {};
        const assignedTo = qr.assigned_to || null;
        const createdBy = qr.created_by || {};
        
        return `
      <div class="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <div class="p-5">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-white font-semibold text-lg">${qr.qr_code_id || "N/A"}</h3>
                  <p class="text-sm text-slate-400">Batch: ${batch.batch_code || "N/A"} • Serial: ${qr.serial_number || "N/A"}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p class="text-xs text-slate-500 mb-1">Item Type</p>
                  <span class="px-2 py-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 rounded-lg">${qr.item_type || "N/A"}</span>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">Passcode</p>
                  <p class="text-sm text-white font-mono">${qr.passcode || "N/A"}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">Status</p>
                  <div class="flex flex-wrap gap-1">
                    ${qr.is_used ? `<span class="px-2 py-1 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg">Used</span>` : `<span class="px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-lg">Unused</span>`}
                    ${qr.is_printed ? `<span class="px-2 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 rounded-lg">Printed</span>` : ""}
                    ${qr.is_downloaded ? `<span class="px-2 py-1 text-xs font-medium text-purple-400 bg-purple-500/10 rounded-lg">Downloaded</span>` : ""}
                  </div>
                </div>
                <div>
                  <p class="text-xs text-slate-500 mb-1">Assigned At</p>
                  <p class="text-sm text-white">${formatDate(qr.assigned_at)}</p>
                </div>
              </div>

              ${assignedTo ? `
                <div class="mb-4 p-3 bg-slate-800/50 border border-white/5 rounded-lg">
                  <p class="text-xs text-slate-500 mb-2">Assigned To</p>
                  <div class="flex items-center gap-3">
                    ${assignedTo.avatar ? `
                      <img src="${assignedTo.avatar.replace(/\\/g, "/")}" alt="${assignedTo.fullName || "User"}" class="w-10 h-10 rounded-lg object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold hidden">${(assignedTo.fullName || "U").charAt(0).toUpperCase()}</div>
                    ` : `
                      <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">${(assignedTo.fullName || "U").charAt(0).toUpperCase()}</div>
                    `}
                    <div class="flex-1">
                      <p class="text-sm text-white font-medium">${assignedTo.fullName || "N/A"}</p>
                      <p class="text-xs text-slate-400">@${assignedTo.username || "N/A"} • ${assignedTo.email || ""}</p>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="mb-4 p-3 bg-slate-800/50 border border-white/5 rounded-lg">
                  <p class="text-xs text-slate-500 mb-1">Assigned To</p>
                  <p class="text-sm text-slate-400">Unassigned</p>
                </div>
              `}

              ${batch.notes ? `
                <div class="mb-4 pt-3 border-t border-white/5">
                  <p class="text-xs text-slate-500 mb-1">Batch Notes</p>
                  <p class="text-sm text-white">${batch.notes}</p>
                </div>
              ` : ""}

              ${createdBy.name ? `
                <div class="pt-3 border-t border-white/5">
                  <p class="text-xs text-slate-500">Created by ${createdBy.name || "Admin"}</p>
                </div>
              ` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
      })
      .join("");
  }

  // Update pagination
  function updatePagination() {
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalItems);

    paginationInfo.textContent = `Showing ${totalItems > 0 ? start : 0}-${end} of ${totalItems} QR codes`;
    pageInfo.textContent = currentPage;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  // Change page
  window.changePage = function (delta) {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    loadQRCodes();
  };

  // Handle batch change
  window.handleBatchChange = function () {
    // Value is already the label (batch code) since we set it that way
    selectedBatch = batchFilter.value;
    currentPage = 1;
    searchTerm = ""; // Clear search when batch changes
    searchInput.value = "";
    
    // Enable/disable export button based on batch selection
    if (exportBtn) {
      exportBtn.disabled = !selectedBatch;
    }
    
    loadQRCodes();
  };

  // Handle search
  window.handleSearch = function (e) {
    if (e.key === "Enter" || e.type === "keyup") {
      searchTerm = searchInput.value.trim();
      selectedBatch = ""; // Clear batch when searching
      batchFilter.value = "";
      currentPage = 1;
      loadQRCodes();
    }
  };

  // Generate QR Codes Modal
  window.openGenerateModal = function () {
    generateModal.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  window.closeGenerateModal = function () {
    generateModal.classList.remove("active");
    document.body.style.overflow = "";
    document.getElementById("generateForm").reset();
  };

  // Close modal on overlay click
  generateModal.addEventListener("click", function (e) {
    if (e.target === generateModal) {
      closeGenerateModal();
    }
  });

  // Handle generate form submission
  window.handleGenerate = async function (e) {
    e.preventDefault();

    const batchCode = document.getElementById("generateBatchCode").value.trim();
    const size = parseInt(document.getElementById("generateSize").value);
    const itemType = document.getElementById("generateItemType").value;
    const notes = document.getElementById("generateNotes").value.trim();

    if (!batchCode || !size || size < 1) {
      showToast("error", "Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "Generating...";

      const response = await fetch(`${API_BASE_URL}/qrcodes/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          batchCode,
          size,
          itemType,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();
      console.log("Generate response:", data);

      if (data.status === false) {
        throw new Error(data.error || "Failed to generate QR codes");
      }

      showToast("success", "Success", `Successfully generated ${size} QR codes`);
      closeGenerateModal();
      
      // Reload QR codes and batches
      await loadBatches();
      selectedBatch = batchCode;
      batchFilter.value = batchCode;
      currentPage = 1;
      await loadQRCodes();
    } catch (error) {
      console.error("Generate error:", error);
      showToast("error", "Error", error.message || "Failed to generate QR codes");
    } finally {
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = "Generate";
    }
  };

  // Export QR Codes
  window.handleExport = async function () {
    if (!selectedBatch) {
      showToast("error", "Error", "Please select a batch to export");
      return;
    }

    // Generate jobId: export-YYYY-MM-DD-RandomLetter
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0].replace(/-/g, "-");
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const jobId = `export-${dateStr}-${randomLetter}`;

    try {
      exportBtn.disabled = true;
      const originalText = exportBtn.innerHTML;
      exportBtn.innerHTML = `
        <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        Exporting...
      `;

      const response = await fetch(`${API_BASE_URL}/qrcodes/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          batchId: selectedBatch,
          jobId: jobId,
        }),
      });

      const data = await response.json();

      if (data.status === false) {
        throw new Error(data.error || "Failed to export QR codes");
      }

      // Show success message with download link
      const zipUrl = data.data?.zipUrl;
      const totalExported = data.data?.totalExported || 0;
      
      if (zipUrl) {
        const BASE_URL = window.APP_CONFIG?.BASE_URL || "http://localhost:3000";
        const fullZipUrl = zipUrl.startsWith("http") ? zipUrl : `${BASE_URL}${zipUrl}`;
        
        showToast(
          "success",
          "Export Successful",
          `Successfully exported ${totalExported} QR codes. Click to download.`
        );
        
        // Create download link
        setTimeout(() => {
          const downloadLink = document.createElement("a");
          downloadLink.href = fullZipUrl;
          downloadLink.download = `QR_Codes_${selectedBatch}_${jobId}.zip`;
          downloadLink.style.display = "none";
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }, 500);
      } else {
        showToast("success", "Export Successful", `Successfully exported ${totalExported} QR codes`);
      }
    } catch (error) {
      console.error("Export error:", error);
      showToast("error", "Error", error.message || "Failed to export QR codes");
    } finally {
      exportBtn.disabled = false;
      exportBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Export QR Codes
      `;
    }
  };

  // Initialize - only load batches, don't load QR codes initially
  loadBatches();
  // Show initial message
  loadQRCodes();
  
  // Initialize export button state
  if (exportBtn) {
    exportBtn.disabled = true;
  }
})();

