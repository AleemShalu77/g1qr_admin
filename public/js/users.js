// App Users Management
(function () {
  "use strict";

  const API_BASE_URL = "/api";
  const BASE_URL = window.APP_CONFIG?.BASE_URL || "http://localhost:3000";

  // State
  let currentPage = 1;
  const limit = 50;
  let totalPages = 1;
  let totalUsers = 0;
  let allUsers = [];
  let searchTerm = "";
  let profilesStore = {}; // Store profiles by ID for modal access

  // DOM Elements
  const usersContainer = document.getElementById("usersContainer");
  const loadingState = document.getElementById("loadingState");
  const statusFilter = document.getElementById("statusFilter");
  const verificationFilter = document.getElementById("verificationFilter");
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
    });
  }

  // Format date of birth
  function formatDOB(dob) {
    if (!dob) return "-";
    const date = new Date(dob);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Get file URL from file object
  function getFileUrl(file) {
    if (!file) return null;

    // Check for direct URL first
    if (file.url) {
      // If URL already contains http/https, use as is
      if (file.url.startsWith("http://") || file.url.startsWith("https://")) {
        return file.url.replace(/\\/g, "/");
      }
      // If relative URL, prepend base URL
      const cleanUrl = file.url.startsWith("/") ? file.url.slice(1) : file.url;
      return `${BASE_URL}/${cleanUrl}`;
    }

    // Check for keyPrefix
    if (file.keyPrefix) {
      const path = file.keyPrefix.replace(/\\/g, "/");
      // Remove leading slash if present
      const cleanPath = path.startsWith("/") ? path.slice(1) : path;
      return `${BASE_URL}/${cleanPath}`;
    }

    return null;
  }

  // Get avatar URL
  function getAvatarUrl(profile) {
    if (!profile) return null;

    // Check if profilePicture exists
    if (profile.profilePicture) {
      const url = getFileUrl(profile.profilePicture);
      if (url) return url;
    }

    return null;
  }

  // Check if file is an image
  function isImageFile(file) {
    if (!file || !file.mime) return false;
    return file.mime.startsWith("image/");
  }

  // Get file icon based on mime type
  function getFileIcon(mime) {
    if (!mime) return "📄";
    if (mime.startsWith("image/")) return "🖼️";
    if (mime === "application/pdf") return "📕";
    if (mime.startsWith("video/")) return "🎥";
    if (mime.startsWith("audio/")) return "🎵";
    return "📄";
  }

  // Load users
  window.loadUsers = async function () {
    try {
      loadingState.style.display = "block";
      usersContainer.innerHTML = "";

      const response = await fetch(
        `${API_BASE_URL}/users?page=${currentPage}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();
      console.log("Users response:", data);

      if (data.status === false) {
        throw new Error(data.error || "Failed to load users");
      }

      allUsers = data.data || [];
      totalUsers = data.pagination?.totalItems || allUsers.length;
      totalPages = data.pagination?.totalPages || 1;

      // Apply filters
      let filteredUsers = allUsers;

      // Status filter
      const status = statusFilter.value;
      if (status) {
        filteredUsers = filteredUsers.filter((u) => u.status === status);
      }

      // Verification filter
      const isVerified = verificationFilter.value;
      if (isVerified) {
        const verified = isVerified === "true";
        filteredUsers = filteredUsers.filter((u) => u.is_verified === verified);
      }

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredUsers = filteredUsers.filter((u) => {
          const emailMatch = u.email?.toLowerCase().includes(term);
          const profileMatch = u.profiles?.some(
            (p) =>
              p.username?.toLowerCase().includes(term) ||
              p.firstName?.toLowerCase().includes(term) ||
              p.lastName?.toLowerCase().includes(term)
          );
          return emailMatch || profileMatch;
        });
      }

      renderUsers(filteredUsers);

      // Update pagination - if filters are active, show all filtered results
      const hasFilters =
        statusFilter.value || verificationFilter.value || searchTerm;
      if (hasFilters) {
        updatePagination(filteredUsers.length, true);
      } else {
        updatePagination(totalUsers, false);
      }
    } catch (error) {
      console.error("Load users error:", error);
      usersContainer.innerHTML = `
        <div class="text-center py-12">
          <p class="text-red-400 mb-4">Failed to load users: ${error.message}</p>
          <button onclick="loadUsers()" class="text-sm text-indigo-400 hover:text-indigo-300">Try again</button>
        </div>
      `;
    } finally {
      loadingState.style.display = "none";
    }
  };

  // Render users
  function renderUsers(users) {
    if (!users || users.length === 0) {
      usersContainer.innerHTML = `
        <div class="text-center py-12">
          <svg class="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          <p class="text-slate-400">No users found</p>
        </div>
      `;
      return;
    }

    usersContainer.innerHTML = users
      .map((user, userIndex) => {
        const userCardId = `user_${user.userId}`;
        return `
      <div class="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden profile-card" id="${userCardId}">
        <!-- User Header -->
        <div class="p-5 border-b border-white/5">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-4 flex-1">
              <!-- User Avatar -->
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                ${(user.email || "U").charAt(0).toUpperCase()}
              </div>
              
              <!-- User Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="text-white font-semibold">${user.email}</p>
                  ${
                    user.is_verified
                      ? `<span class="px-2 py-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-lg">Verified</span>`
                      : `<span class="px-2 py-0.5 text-xs font-medium text-amber-400 bg-amber-500/10 rounded-lg">Unverified</span>`
                  }
                  ${
                    user.google_id
                      ? `<span class="px-2 py-0.5 text-xs font-medium text-blue-400 bg-blue-500/10 rounded-lg">Google</span>`
                      : ""
                  }
                </div>
                <div class="flex items-center gap-4 text-xs text-slate-400">
                  <span>Status: <span class="text-white font-medium">${
                    user.status || "N/A"
                  }</span></span>
                  <span>Role: <span class="text-white font-medium">${
                    user.role || "N/A"
                  }</span></span>
                  <span>Language: <span class="text-white font-medium">${
                    user.preferred_language || "N/A"
                  }</span></span>
                  <span>Joined: <span class="text-white font-medium">${formatDate(
                    user.created_at
                  )}</span></span>
                </div>
              </div>
            </div>

            <!-- Profiles Count -->
            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-2xl font-bold text-white">${
                  user.totalProfiles || 0
                }</p>
                <p class="text-xs text-slate-400">Profile${
                  (user.totalProfiles || 0) !== 1 ? "s" : ""
                }</p>
              </div>
              <button
                onclick="toggleUserProfiles('${userCardId}')"
                class="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Toggle profiles"
              >
                <svg id="${userCardId}_icon" class="w-5 h-5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Profiles List (Collapsed by default) -->
        <div id="${userCardId}_profiles" class="hidden">
          ${renderProfiles(user.profiles || [], userCardId)}
        </div>
      </div>
    `;
      })
      .join("");
  }

  // Render profiles for a user
  function renderProfiles(profiles, userCardId) {
    if (!profiles || profiles.length === 0) {
      return `
        <div class="p-5 text-center text-slate-400">
          <p>No profiles found</p>
        </div>
      `;
    }

    return `
      <div class="divide-y divide-white/5">
        ${profiles
          .map((profile, profileIndex) => {
            const profileId = profile.profileId || profile._id;
            // Store profile in global store for modal access
            profilesStore[profileId] = profile;
            const avatarUrl = getAvatarUrl(profile);
            const fullName =
              `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
              "Unknown";
            const membership = profile.membership;
            const qrItems = profile.qr_items || [];

            return `
          <div class="p-5 hover:bg-white/[0.02] transition-colors">
            <div class="flex items-start gap-4">
              <!-- Profile Avatar -->
              <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-lg shrink-0 overflow-hidden">
                ${
                  avatarUrl
                    ? `<img src="${avatarUrl}" alt="${fullName}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="w-full h-full items-center justify-center hidden">${fullName
                       .charAt(0)
                       .toUpperCase()}</div>`
                    : fullName.charAt(0).toUpperCase()
                }
              </div>

              <!-- Profile Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h4 class="text-white font-semibold text-lg mb-1">${fullName}</h4>
                    <p class="text-sm text-slate-400">@${
                      profile.username || "N/A"
                    }</p>
                  </div>
                  ${
                    membership
                      ? `
                    <div class="text-right">
                      <span class="px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-lg">${
                        membership.plan_name || "Member"
                      }</span>
                      <p class="text-xs text-slate-500 mt-1">Expires: ${formatDate(
                        membership.expiry_date
                      )}</p>
                    </div>
                  `
                      : `
                    <span class="px-2 py-1 text-xs font-medium text-slate-400 bg-slate-500/10 rounded-lg">No Membership</span>
                  `
                  }
                </div>

                <!-- Profile Details Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p class="text-xs text-slate-500 mb-1">Gender</p>
                    <p class="text-sm text-white">${profile.gender || "N/A"}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-500 mb-1">Date of Birth</p>
                    <p class="text-sm text-white">${formatDOB(profile.dob)}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-500 mb-1">Location</p>
                    <p class="text-sm text-white">${
                      profile.address?.city || "N/A"
                    }, ${profile.address?.country || ""}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-500 mb-1">QR Items</p>
                    <p class="text-sm text-white">${qrItems.length}</p>
                  </div>
                </div>

                <!-- Medical Info Summary -->
                ${
                  profile.medical_information
                    ? `
                  <div class="flex flex-wrap gap-2 mb-3">
                    ${
                      profile.medical_information.blood_type
                        ? `<span class="px-2 py-1 text-xs font-medium text-white bg-red-500/20 border border-red-500/30 rounded-lg">Blood: ${profile.medical_information.blood_type}</span>`
                        : ""
                    }
                    ${
                      (profile.medical_information.allergies || []).length > 0
                        ? `<span class="px-2 py-1 text-xs font-medium text-white bg-orange-500/20 border border-orange-500/30 rounded-lg">${profile.medical_information.allergies.length} Allergies</span>`
                        : ""
                    }
                    ${
                      (profile.medical_information.chronic_diseases || [])
                        .length > 0
                        ? `<span class="px-2 py-1 text-xs font-medium text-white bg-amber-500/20 border border-amber-500/30 rounded-lg">${profile.medical_information.chronic_diseases.length} Conditions</span>`
                        : ""
                    }
                    ${
                      (profile.medical_information.medications || []).length > 0
                        ? `<span class="px-2 py-1 text-xs font-medium text-white bg-blue-500/20 border border-blue-500/30 rounded-lg">${profile.medical_information.medications.length} Medications</span>`
                        : ""
                    }
                  </div>
                `
                    : ""
                }

                <!-- Stats -->
                <div class="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-white/5 mb-3">
                  ${
                    (profile.medical_history || []).length > 0
                      ? `<span>Medical History: ${profile.medical_history.length}</span>`
                      : ""
                  }
                  ${
                    (profile.medical_documents || []).length > 0
                      ? `<span>Documents: ${profile.medical_documents.length}</span>`
                      : ""
                  }
                  ${
                    (profile.emergency_details?.contacts || []).length > 0
                      ? `<span>Emergency Contacts: ${profile.emergency_details.contacts.length}</span>`
                      : ""
                  }
                  ${
                    qrItems.length > 0
                      ? `<span>QR Items: ${qrItems.length}</span>`
                      : ""
                  }
                </div>

                <!-- View Profile Details Button -->
                <button
                  onclick="viewProfileDetails('${profileId}')"
                  class="mt-2 px-4 py-2 text-sm font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  View Profile Details
                </button>
              </div>
            </div>
          </div>
        `;
          })
          .join("")}
      </div>
    `;
  }

  // Toggle user profiles
  window.toggleUserProfiles = function (userCardId) {
    const profilesDiv = document.getElementById(`${userCardId}_profiles`);
    const icon = document.getElementById(`${userCardId}_icon`);
    const card = document.getElementById(userCardId);

    if (profilesDiv.classList.contains("hidden")) {
      profilesDiv.classList.remove("hidden");
      icon.style.transform = "rotate(180deg)";
      card.classList.add("expanded");
    } else {
      profilesDiv.classList.add("hidden");
      icon.style.transform = "rotate(0deg)";
      card.classList.remove("expanded");
    }
  };

  // Update pagination
  function updatePagination(count, isFiltered = false) {
    const paginationDiv = document.getElementById("pagination");

    if (isFiltered) {
      // When filtered, show all results on one page
      paginationInfo.textContent = `Showing ${count} user${
        count !== 1 ? "s" : ""
      }`;
      pageInfo.textContent = "1";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      paginationDiv.style.display = count > 0 ? "flex" : "none";
    } else {
      // Normal pagination
      const start = (currentPage - 1) * limit + 1;
      const end = Math.min(currentPage * limit, count);

      paginationInfo.textContent = `Showing ${
        count > 0 ? start : 0
      }-${end} of ${count} users`;
      pageInfo.textContent = currentPage;

      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
      paginationDiv.style.display = "flex";
    }
  }

  // Change page
  window.changePage = function (delta) {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    loadUsers();
  };

  // Handle search
  window.handleSearch = function (e) {
    if (e.key === "Enter" || e.type === "keyup") {
      searchTerm = searchInput.value.trim();
      currentPage = 1;
      loadUsers();
    }
  };

  // View Profile Details Modal
  window.viewProfileDetails = function (profileId) {
    const profile = profilesStore[profileId];
    if (!profile) {
      showToast("error", "Error", "Profile not found");
      return;
    }

    const modal = document.getElementById("profileModal");
    const modalAvatar = document.getElementById("modalAvatar");
    const modalName = document.getElementById("modalName");
    const modalUsername = document.getElementById("modalUsername");
    const modalBody = document.getElementById("modalBody");

    const fullName =
      `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
      "Unknown";
    const avatarUrl = getAvatarUrl(profile);
    const firstLetter = fullName.charAt(0).toUpperCase();

    // Set avatar
    if (avatarUrl) {
      modalAvatar.innerHTML = `<img src="${avatarUrl}" alt="${fullName}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="w-full h-full items-center justify-center hidden">${firstLetter}</div>`;
    } else {
      modalAvatar.innerHTML = firstLetter;
    }

    modalName.textContent = fullName;
    modalUsername.textContent = `@${profile.username || "N/A"}`;

    // Render profile details
    modalBody.innerHTML = renderProfileDetails(profile);

    // Show modal
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  };

  // Close Profile Details Modal
  window.closeProfileModal = function () {
    const modal = document.getElementById("profileModal");
    modal.classList.remove("show");
    document.body.style.overflow = "";
  };

  // Close modal on overlay click
  document.addEventListener("click", function (e) {
    const modal = document.getElementById("profileModal");
    if (e.target === modal) {
      closeProfileModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeProfileModal();
    }
  });

  // Render comprehensive profile details
  function renderProfileDetails(profile) {
    const address = profile.address || {};
    const medicalInfo = profile.medical_information || {};
    const vitals = profile.vitals_background || {};
    const emergency = profile.emergency_details || {};
    const membership = profile.membership || null;
    const qrItems = profile.qr_items || [];
    const medicalHistory = profile.medical_history || [];
    const medicalDocs = profile.medical_documents || [];
    const insurance = profile.insurance || {};
    const legalCare = profile.legal_care_preferences || {};
    const specialDevices = profile.special_medical_devices || {};
    const disabilities = profile.disabilities || {};

    return `
      <div class="space-y-6">
        <!-- Basic Information -->
        <div class="bg-slate-800/50 border border-white/5 rounded-xl p-5">
          <h3 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Basic Information
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-slate-500 mb-1">Gender</p>
              <p class="text-sm text-white">${profile.gender || "N/A"}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 mb-1">Date of Birth</p>
              <p class="text-sm text-white">${formatDOB(profile.dob)}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 mb-1">Languages</p>
              <p class="text-sm text-white">${
                (profile.i_speak || []).join(", ") || "N/A"
              }</p>
            </div>
            <div class="col-span-2 md:col-span-3">
              <p class="text-xs text-slate-500 mb-1">Address</p>
              <p class="text-sm text-white">
  ${
    `${address.street_house_no || ""} ${address.city || ""} ${
      address.state || ""
    } ${address.postal_code || ""} ${address.country || ""}`.trim() || "N/A"
  }
</p>

            </div>
          </div>
        </div>

        <!-- Membership -->
        ${
          membership
            ? `
          <div class="bg-slate-800/50 border border-white/5 rounded-xl p-5">
            <h3 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Membership
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p class="text-xs text-slate-500 mb-1">Plan</p>
                <p class="text-sm text-white font-medium">${
                  membership.plan_name || "N/A"
                }</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Purchased</p>
                <p class="text-sm text-white">${formatDate(
                  membership.purchased_date
                )}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 mb-1">Expires</p>
                <p class="text-sm text-white">${formatDate(
                  membership.expiry_date
                )}</p>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- Medical Information -->
        ${
          medicalInfo.blood_type ||
          medicalInfo.allergies?.length ||
          medicalInfo.chronic_diseases?.length ||
          medicalInfo.medications?.length
            ? `
          <div class="bg-slate-800/50 border border-white/5 rounded-xl p-5">
            <h3 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              Medical Information
            </h3>
            <div class="space-y-4">
              ${
                medicalInfo.blood_type
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-1">Blood Type</p>
                  <p class="text-sm text-white font-medium">${medicalInfo.blood_type}</p>
                </div>
              `
                  : ""
              }
              ${
                medicalInfo.allergies?.length > 0
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-2">Allergies</p>
                  <div class="flex flex-wrap gap-2">
                    ${medicalInfo.allergies
                      .map(
                        (a) =>
                          `<span class="px-2 py-1 text-xs font-medium text-white bg-orange-500/20 border border-orange-500/30 rounded-lg">${a}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              ${
                medicalInfo.chronic_diseases?.length > 0
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-2">Chronic Diseases</p>
                  <div class="flex flex-wrap gap-2">
                    ${medicalInfo.chronic_diseases
                      .map(
                        (d) =>
                          `<span class="px-2 py-1 text-xs font-medium text-white bg-amber-500/20 border border-amber-500/30 rounded-lg">${d}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              ${
                medicalInfo.temporary_conditions?.length > 0
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-2">Temporary Conditions</p>
                  <div class="flex flex-wrap gap-2">
                    ${medicalInfo.temporary_conditions
                      .map(
                        (c) =>
                          `<span class="px-2 py-1 text-xs font-medium text-white bg-yellow-500/20 border border-yellow-500/30 rounded-lg">${c}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              ${
                medicalInfo.medications?.length > 0
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-2">Medications</p>
                  <div class="space-y-2">
                    ${medicalInfo.medications
                      .map(
                        (m) => `
                      <div class="bg-slate-900/50 border border-white/5 rounded-lg p-3">
                        <p class="text-sm text-white font-medium">${m.name}</p>
                        <p class="text-xs text-slate-400">${
                          m.dosage_frequency || "N/A"
                        }</p>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              ${
                medicalInfo.surgeries?.length > 0
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-2">Surgeries</p>
                  <div class="space-y-2">
                    ${medicalInfo.surgeries
                      .map(
                        (s) => `
                      <div class="bg-slate-900/50 border border-white/5 rounded-lg p-3">
                        <p class="text-sm text-white font-medium">${s.type}</p>
                        <p class="text-xs text-slate-400">${formatDate(
                          s.date
                        )}</p>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }

        <!-- Vitals & Background -->
        ${
          vitals.height_cm ||
          vitals.weight_kg ||
          vitals.blood_pressure_readings?.length ||
          vitals.vaccinations?.length
            ? `
          <div class="bg-slate-800/50 border border-white/5 rounded-xl p-5">
            <h3 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Vitals & Background
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              ${
                vitals.height_cm
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-1">Height</p>
                  <p class="text-sm text-white">${vitals.height_cm} cm</p>
                </div>
              `
                  : ""
              }
              ${
                vitals.weight_kg
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-1">Weight</p>
                  <p class="text-sm text-white">${vitals.weight_kg} kg</p>
                </div>
              `
                  : ""
              }
              ${
                vitals.lifestyle
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-1">Lifestyle</p>
                  <div class="flex flex-wrap gap-1">
                    ${
                      vitals.lifestyle.smoker
                        ? `<span class="px-1.5 py-0.5 text-xs text-white bg-red-500/20 rounded">Smoker</span>`
                        : ""
                    }
                    ${
                      vitals.lifestyle.alcoholic
                        ? `<span class="px-1.5 py-0.5 text-xs text-white bg-amber-500/20 rounded">Alcoholic</span>`
                        : ""
                    }
                    ${
                      vitals.lifestyle.substance_use
                        ? `<span class="px-1.5 py-0.5 text-xs text-white bg-orange-500/20 rounded">Substance Use</span>`
                        : ""
                    }
                  </div>
                </div>
              `
                  : ""
              }
            </div>
            ${
              vitals.vaccinations?.length > 0
                ? `
              <div class="mt-4">
                <p class="text-xs text-slate-500 mb-2">Vaccinations</p>
                <div class="space-y-2">
                  ${vitals.vaccinations
                    .map(
                      (v) => `
                    <div class="bg-slate-900/50 border border-white/5 rounded-lg p-3">
                      <p class="text-sm text-white">${v.type}</p>
                      <p class="text-xs text-slate-400">${formatDate(
                        v.date
                      )}</p>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
          </div>
        `
            : ""
        }

        <!-- Emergency Details -->
        ${
          emergency.contacts?.length > 0 ||
          emergency.known_medical_alerts?.length > 0 ||
          emergency.note_for_rescuers
            ? `
          <div class="bg-slate-800/50 border border-white/5 rounded-xl p-5">
            <h3 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Emergency Details
            </h3>
            <div class="space-y-4">
              ${
                emergency.note_for_rescuers
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-1">Note for Rescuers</p>
                  <p class="text-sm text-white">${emergency.note_for_rescuers}</p>
                </div>
              `
                  : ""
              }
              ${
                emergency.contacts?.length > 0
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-2">Emergency Contacts</p>
                  <div class="space-y-2">
                    ${emergency.contacts
                      .map(
                        (c) => `
                      <div class="bg-slate-900/50 border border-white/5 rounded-lg p-3">
                        <p class="text-sm text-white font-medium">${
                          c.relation
                        }</p>
                        <p class="text-xs text-slate-400">${
                          c.country_code || ""
                        } ${c.phone || ""}</p>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
              ${
                emergency.known_medical_alerts?.length > 0
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-2">Medical Alerts</p>
                  <div class="flex flex-wrap gap-2">
                    ${emergency.known_medical_alerts
                      .map(
                        (a) =>
                          `<span class="px-2 py-1 text-xs font-medium text-white bg-red-500/20 border border-red-500/30 rounded-lg">${a.name}</span>`
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }

        <!-- QR Items -->
        ${
          qrItems.length > 0
            ? `
          <div class="bg-slate-800/50 border border-white/5 rounded-xl p-5">
            <h3 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
              QR Items (${qrItems.length})
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              ${qrItems
                .map(
                  (qr) => `
                <div class="bg-slate-900/50 border border-white/5 rounded-lg p-3">
                  <p class="text-sm text-white font-medium">${
                    qr.item_id || "N/A"
                  }</p>
                  <p class="text-xs text-slate-400">Batch: ${
                    qr.batch_code || "N/A"
                  }</p>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Medical History -->
        ${
          medicalHistory.length > 0
            ? `
          <div class="bg-slate-800/50 border border-white/5 rounded-xl p-5">
            <h3 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Medical History (${medicalHistory.length})
            </h3>
            <div class="space-y-3">
              ${medicalHistory
                .slice(0, 5)
                .map((h) => {
                  const fileUrl = getFileUrl(h.file);
                  const isImage = isImageFile(h.file);
                  return `
                <div class="bg-slate-900/50 border border-white/5 rounded-lg p-3">
                  <div class="flex items-start justify-between mb-2">
                    <span class="px-2 py-1 text-xs font-medium text-purple-400 bg-purple-500/10 rounded-lg">${
                      h.category || "N/A"
                    }</span>
                    <span class="text-xs text-slate-500">${formatDate(
                      h.created_at
                    )}</span>
                  </div>
                  ${
                    h.notes
                      ? `<p class="text-sm text-white mb-2">${h.notes.replace(
                          /<[^>]*>/g,
                          ""
                        )}</p>`
                      : ""
                  }
                  ${
                    fileUrl
                      ? `
                    <div class="mt-2">
                      ${
                        isImage
                          ? `
                        <a href="${fileUrl}" target="_blank" class="inline-block group">
                          <div class="relative w-24 h-24 rounded-lg border border-white/10 group-hover:border-indigo-500/50 transition-colors overflow-hidden bg-slate-900/50">
                            <img src="${fileUrl}" alt="${
                              h.category || "Medical History"
                            }" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="hidden absolute inset-0 items-center justify-center bg-slate-800/80">
                              <span class="text-2xl">${getFileIcon(
                                h.file?.mime
                              )}</span>
                            </div>
                            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <svg class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                              </svg>
                            </div>
                          </div>
                        </a>
                      `
                          : `
                        <a href="${fileUrl}" target="_blank" class="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-white/5 hover:border-indigo-500/50 transition-colors group">
                          <span class="text-2xl">${getFileIcon(
                            h.file?.mime
                          )}</span>
                          <div class="flex-1">
                            <p class="text-sm text-white">${
                              h.category || "Medical History"
                            } File</p>
                            <p class="text-xs text-slate-400">${
                              h.file?.mime || "File"
                            } • Click to open</p>
                          </div>
                          <svg class="w-4 h-4 text-slate-400 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                          </svg>
                        </a>
                      `
                      }
                    </div>
                  `
                      : ""
                  }
                </div>
              `;
                })
                .join("")}
              ${
                medicalHistory.length > 5
                  ? `<p class="text-xs text-slate-400 text-center">+ ${
                      medicalHistory.length - 5
                    } more entries</p>`
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }

        <!-- Medical Documents -->
        ${
          medicalDocs.length > 0
            ? `
          <div class="bg-slate-800/50 border border-white/5 rounded-xl p-5">
            <h3 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Medical Documents (${medicalDocs.length})
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              ${medicalDocs
                .map((doc) => {
                  const fileUrl = getFileUrl(doc.file);
                  const isImage = isImageFile(doc.file);
                  return `
                <div class="bg-slate-900/50 border border-white/5 rounded-lg overflow-hidden">
                  ${
                    fileUrl && isImage
                      ? `
                    <a href="${fileUrl}" target="_blank" class="block group relative">
                      <div class="aspect-square w-full bg-slate-800/50">
                        <img src="${fileUrl}" alt="${
                          doc.title || "Medical Document"
                        }" class="w-full h-full object-cover group-hover:opacity-90 transition-opacity" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="hidden absolute inset-0 items-center justify-center bg-slate-800/80">
                          <span class="text-3xl">${getFileIcon(
                            doc.file?.mime
                          )}</span>
                        </div>
                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                          </svg>
                        </div>
                      </div>
                    </a>
                  `
                      : fileUrl
                      ? `
                    <div class="aspect-square w-full bg-slate-800/50 flex items-center justify-center">
                      <span class="text-4xl">${getFileIcon(
                        doc.file?.mime
                      )}</span>
                    </div>
                  `
                      : ""
                  }
                  <div class="p-2.5">
                    <p class="text-xs text-white font-medium mb-1 truncate" title="${
                      doc.title || "Untitled"
                    }">${doc.title || "Untitled"}</p>
                    <p class="text-xs text-slate-400 mb-2">${
                      doc.file?.mime?.split("/")[1]?.toUpperCase() || "FILE"
                    }</p>
                    ${
                      fileUrl
                        ? `
                      <a href="${fileUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition-colors w-full justify-center">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        Open
                      </a>
                    `
                        : ""
                    }
                  </div>
                </div>
              `;
                })
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Insurance Cards -->
        ${
          insurance.card?.length > 0
            ? `
          <div class="bg-slate-800/50 border border-white/5 rounded-xl p-5">
            <h3 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
              Insurance Cards (${insurance.card.length})
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              ${insurance.card
                .map((card) => {
                  const fileUrl = getFileUrl(card);
                  const isImage = isImageFile(card);
                  return `
                <div class="bg-slate-900/50 border border-white/5 rounded-lg overflow-hidden">
                  ${
                    fileUrl && isImage
                      ? `
                    <a href="${fileUrl}" target="_blank" class="block group relative">
                      <div class="aspect-square w-full bg-slate-800/50">
                        <img src="${fileUrl}" alt="Insurance Card" class="w-full h-full object-cover group-hover:opacity-90 transition-opacity" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="hidden absolute inset-0 items-center justify-center bg-slate-800/80">
                          <span class="text-3xl">${getFileIcon(
                            card.mime
                          )}</span>
                        </div>
                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                          </svg>
                        </div>
                      </div>
                    </a>
                  `
                      : fileUrl
                      ? `
                    <div class="aspect-square w-full bg-slate-800/50 flex items-center justify-center">
                      <span class="text-4xl">${getFileIcon(card.mime)}</span>
                    </div>
                  `
                      : ""
                  }
                  <div class="p-2.5">
                    <p class="text-xs text-white font-medium mb-1">Insurance Card</p>
                    <p class="text-xs text-slate-400 mb-2">${
                      card.mime?.split("/")[1]?.toUpperCase() || "FILE"
                    }</p>
                    ${
                      fileUrl
                        ? `
                      <a href="${fileUrl}" target="_blank" class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-white bg-green-500/30 hover:bg-green-500/40 border border-green-500/40 rounded transition-colors w-full justify-center">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        View
                      </a>
                    `
                        : ""
                    }
                  </div>
                </div>
              `;
                })
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Legal Care Preferences - Patient Directive -->
        ${
          legalCare.patient_directive?.file
            ? `
          <div class="bg-slate-800/50 border border-white/5 rounded-xl p-5">
            <h3 class="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Patient Directive
            </h3>
            <div class="space-y-3">
              ${
                legalCare.patient_directive.summary_text
                  ? `
                <div>
                  <p class="text-xs text-slate-500 mb-1">Summary</p>
                  <p class="text-sm text-white">${legalCare.patient_directive.summary_text}</p>
                </div>
              `
                  : ""
              }
              ${
                legalCare.patient_directive.file
                  ? (() => {
                      const fileUrl = getFileUrl(
                        legalCare.patient_directive.file
                      );
                      const isImage = isImageFile(
                        legalCare.patient_directive.file
                      );
                      return `
                <div>
                  <p class="text-xs text-slate-500 mb-2">Document</p>
                  ${
                    fileUrl && isImage
                      ? `
                    <a href="${fileUrl}" target="_blank" class="block group">
                      <div class="relative w-40 h-40 rounded-lg border border-white/10 group-hover:border-cyan-500/50 transition-colors overflow-hidden bg-slate-900/50">
                        <img src="${fileUrl}" alt="Patient Directive" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="hidden absolute inset-0 items-center justify-center bg-slate-800/80">
                          <span class="text-3xl">${getFileIcon(
                            legalCare.patient_directive.file.mime
                          )}</span>
                        </div>
                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                          </svg>
                        </div>
                      </div>
                    </a>
                  `
                      : fileUrl
                      ? `
                    <a href="${fileUrl}" target="_blank" class="flex items-center gap-3 px-3 py-2 bg-slate-900/50 rounded-lg border border-white/5 hover:border-cyan-500/50 transition-colors group">
                      <span class="text-2xl">${getFileIcon(
                        legalCare.patient_directive.file.mime
                      )}</span>
                      <div class="flex-1">
                        <p class="text-sm text-white">Patient Directive</p>
                        <p class="text-xs text-slate-400">${
                          legalCare.patient_directive.file.mime || "File"
                        } • Click to open</p>
                      </div>
                      <svg class="w-4 h-4 text-slate-400 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  `
                      : ""
                  }
                </div>
              `;
                    })()
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  // Initialize
  loadUsers();
})();
