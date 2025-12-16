// Newsletter Management
(function () {
  "use strict";

  const API_BASE_URL = "/api";

  // State
  let currentPage = 1;
  const limit = 20;
  let totalPages = 1;
  let totalSubscribers = 0;
  let quillEditor = null;

  // DOM Elements
  const subscribersContainer = document.getElementById("subscribersContainer");
  const loadingState = document.getElementById("loadingState");
  const totalSubscribersEl = document.getElementById("totalSubscribers");
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
    } else if (type === "warning") {
      toastContent.className =
        "rounded-2xl p-4 shadow-2xl flex items-start gap-3 border backdrop-blur-xl bg-amber-500/90 border-amber-400/20 text-white";
      toastIcon.innerHTML =
        '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
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

  // Format date with time
  function formatDateTime(dateStr) {
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

  // Initialize Quill Editor
  function initializeEditor() {
    if (quillEditor) return;

    quillEditor = new Quill("#editor", {
      theme: "snow",
      placeholder: "Compose your newsletter content...",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image"],
          ["blockquote", "code-block"],
          ["clean"],
        ],
      },
    });

    // Auto-update character count or other features can be added here
    quillEditor.on("text-change", function () {
      // Could add character count, word count, etc.
    });
  }

  // Load subscribers
  window.loadSubscribers = async function () {
    try {
      loadingState.style.display = "block";
      
      // Clear existing subscribers except loading state
      const existingCards = subscribersContainer.querySelectorAll('.subscriber-card');
      existingCards.forEach(card => card.remove());

      const response = await fetch(
        `${API_BASE_URL}/newsletter/subscribers?page=${currentPage}&limit=${limit}&status=active`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch subscribers");
      }

      loadingState.style.display = "none";

      // Handle different response structures
      const subscribers = result.data?.subscribers || result.subscribers || result.data || [];
      const pagination = result.data?.pagination || result.pagination || {};
      
      totalSubscribers = pagination.total || pagination.totalItems || subscribers.length || 0;
      totalPages = pagination.totalPages || pagination.pages || Math.ceil(totalSubscribers / limit) || 1;
      currentPage = pagination.currentPage || pagination.page || currentPage;

      // Update stats
      totalSubscribersEl.textContent = totalSubscribers.toLocaleString();

      // Render subscribers
      renderSubscribers(subscribers);
      updatePagination();

    } catch (error) {
      console.error("Load subscribers error:", error);
      loadingState.style.display = "none";
      
      subscribersContainer.innerHTML = `
        <div class="p-8 text-center">
          <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p class="text-slate-400 text-sm">${error.message || "Failed to load subscribers"}</p>
          <button onclick="loadSubscribers()" class="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium">Try again</button>
        </div>
      `;
      
      showToast("error", "Error", error.message || "Failed to load subscribers");
    }
  };

  // Render subscribers list
  function renderSubscribers(subscribers) {
    if (!subscribers || subscribers.length === 0) {
      subscribersContainer.innerHTML = `
        <div class="p-8 text-center">
          <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <p class="text-slate-400 text-sm">No subscribers yet</p>
        </div>
      `;
      return;
    }

    let html = "";
    subscribers.forEach((subscriber, index) => {
      const email = subscriber.email || subscriber.userEmail || "-";
      const subscribedAt = subscriber.subscribedAt || subscriber.createdAt || subscriber.created_at;
      const name = subscriber.name || subscriber.userName || "";
      const initials = name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();
      
      html += `
        <div class="subscriber-card p-3 border-b border-white/5 flex items-center gap-3 hover:bg-white/5 transition-colors" style="animation: fadeIn 0.3s ease forwards; animation-delay: ${index * 0.03}s; opacity: 0;">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-lg shadow-indigo-500/20">
            ${initials}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate">${email}</p>
            ${name ? `<p class="text-slate-500 text-xs truncate">${name}</p>` : ''}
          </div>
          <div class="text-right shrink-0">
            <p class="text-slate-500 text-xs">${formatDate(subscribedAt)}</p>
          </div>
        </div>
      `;
    });

    // Add keyframe animation if not exists
    if (!document.getElementById('fadeInStyle')) {
      const style = document.createElement('style');
      style.id = 'fadeInStyle';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    subscribersContainer.innerHTML = html;
  }

  // Update pagination UI
  function updatePagination() {
    const start = totalSubscribers === 0 ? 0 : (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalSubscribers);

    paginationInfo.textContent = `Showing ${start}-${end} of ${totalSubscribers}`;
    pageInfo.textContent = currentPage;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  // Change page
  window.changePage = function (direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
      currentPage = newPage;
      loadSubscribers();
    }
  };

  // Toggle plain text section
  window.togglePlainText = function () {
    const container = document.getElementById("plainTextContainer");
    const chevron = document.getElementById("plainTextChevron");
    
    container.classList.toggle("hidden");
    chevron.style.transform = container.classList.contains("hidden") ? "rotate(0deg)" : "rotate(90deg)";
  };

  // Unsubscribe footer HTML
  const UNSUBSCRIBE_FOOTER = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
      <p style="margin: 0 0 8px 0;">You're receiving this email because you subscribed to our newsletter.</p>
      <p style="margin: 0;">
        <a href="https://appg1.fairliefer.de/unsubscribe" style="color: #6366f1; text-decoration: underline;">Unsubscribe</a> from future emails
      </p>
    </div>
  `;

  // Get HTML content from editor (without footer)
  function getRawHtmlContent() {
    if (!quillEditor) return "";
    return quillEditor.root.innerHTML;
  }

  // Get HTML content from editor (with unsubscribe footer)
  function getHtmlContent() {
    const rawHtml = getRawHtmlContent();
    if (!rawHtml || rawHtml === "<p><br></p>") return "";
    return rawHtml + UNSUBSCRIBE_FOOTER;
  }

  // Unsubscribe footer plain text
  const UNSUBSCRIBE_FOOTER_TEXT = `\n\n---\nYou're receiving this email because you subscribed to our newsletter.\nUnsubscribe: https://appg1.fairliefer.de/unsubscribe`;

  // Get plain text content
  function getPlainTextContent() {
    const customText = document.getElementById("emailText").value.trim();
    let baseText = "";
    
    if (customText) {
      baseText = customText;
    } else if (quillEditor) {
      // Auto-generate from HTML
      baseText = quillEditor.getText().trim();
    }
    
    return baseText + UNSUBSCRIBE_FOOTER_TEXT;
  }

  // Open preview modal
  window.openPreviewModal = function () {
    const subject = document.getElementById("emailSubject").value.trim();
    const rawHtml = getRawHtmlContent();

    if (!subject) {
      showToast("warning", "Missing Subject", "Please enter an email subject");
      return;
    }

    if (!rawHtml || rawHtml === "<p><br></p>") {
      showToast("warning", "Missing Content", "Please enter some content for your newsletter");
      return;
    }

    // Show preview with unsubscribe footer
    const fullHtml = rawHtml + UNSUBSCRIBE_FOOTER;
    document.getElementById("previewSubject").textContent = `Subject: ${subject}`;
    document.getElementById("previewContent").innerHTML = fullHtml;
    document.getElementById("previewModal").classList.add("active");
  };

  // Close preview modal
  window.closePreviewModal = function () {
    document.getElementById("previewModal").classList.remove("active");
  };

  // Open confirm modal
  window.openConfirmModal = function () {
    const subject = document.getElementById("emailSubject").value.trim();
    const rawHtml = getRawHtmlContent();

    if (!subject) {
      showToast("warning", "Missing Subject", "Please enter an email subject");
      return;
    }

    if (!rawHtml || rawHtml === "<p><br></p>") {
      showToast("warning", "Missing Content", "Please enter some content for your newsletter");
      return;
    }

    document.getElementById("confirmSubscriberCount").textContent = totalSubscribers.toLocaleString();
    document.getElementById("confirmModal").classList.add("active");
  };

  // Close confirm modal
  window.closeConfirmModal = function () {
    document.getElementById("confirmModal").classList.remove("active");
  };

  // Send newsletter
  window.sendNewsletter = async function () {
    const subject = document.getElementById("emailSubject").value.trim();
    const html = getHtmlContent();
    const text = getPlainTextContent();

    const sendBtn = document.getElementById("confirmSendBtn");
    const spinner = document.getElementById("sendSpinner");
    const btnText = document.getElementById("sendBtnText");

    try {
      // Disable button and show spinner
      sendBtn.disabled = true;
      spinner.classList.remove("hidden");
      btnText.textContent = "Sending...";

      const response = await fetch(`${API_BASE_URL}/newsletter/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          subject,
          html,
          text,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send newsletter");
      }

      // Success
      closeConfirmModal();
      showToast("success", "Newsletter Sent!", `Successfully sent to ${totalSubscribers} subscribers`);

      // Clear form
      document.getElementById("emailSubject").value = "";
      document.getElementById("emailText").value = "";
      if (quillEditor) {
        quillEditor.setContents([]);
      }

    } catch (error) {
      console.error("Send newsletter error:", error);
      showToast("error", "Send Failed", error.message || "Failed to send newsletter");
    } finally {
      // Re-enable button
      sendBtn.disabled = false;
      spinner.classList.add("hidden");
      btnText.textContent = "Send Now";
    }
  };

  // Close modals on escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closePreviewModal();
      closeConfirmModal();
    }
  });

  // Close modals on backdrop click
  document.getElementById("previewModal")?.addEventListener("click", function (e) {
    if (e.target === this) {
      closePreviewModal();
    }
  });

  document.getElementById("confirmModal")?.addEventListener("click", function (e) {
    if (e.target === this) {
      closeConfirmModal();
    }
  });

  // Initialize on page load
  document.addEventListener("DOMContentLoaded", function () {
    initializeEditor();
    loadSubscribers();
  });
})();

