// Forgot Password Form Validation & API Integration
(function () {
  "use strict";

  // Get API base URL from config
  const API_BASE_URL =
    window.APP_CONFIG?.API_BASE_URL || "http://localhost:3000/api";

  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("email-error");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const btnArrow = document.getElementById("btnArrow");
  const btnSpinner = document.getElementById("btnSpinner");
  const successState = document.getElementById("successState");
  const sentEmail = document.getElementById("sentEmail");

  // Validation patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Show error for input
  function showError(input, errorElement, message) {
    input.classList.add("error");
    const span = errorElement.querySelector("span");
    if (span) {
      span.textContent = message;
    } else {
      errorElement.textContent = message;
    }
    errorElement.classList.remove("hidden");
  }

  // Clear error for input
  function clearError(input, errorElement) {
    input.classList.remove("error");
    const span = errorElement.querySelector("span");
    if (span) {
      span.textContent = "";
    } else {
      errorElement.textContent = "";
    }
    errorElement.classList.add("hidden");
  }

  // Validate email
  function validateEmail() {
    const email = emailInput.value.trim();

    if (!email) {
      showError(emailInput, emailError, "Email address is required");
      return false;
    }

    if (!emailRegex.test(email)) {
      showError(emailInput, emailError, "Please enter a valid email address");
      return false;
    }

    clearError(emailInput, emailError);
    return true;
  }

  // Real-time validation on blur
  emailInput.addEventListener("blur", validateEmail);

  // Clear errors on input
  emailInput.addEventListener("input", function () {
    if (emailInput.classList.contains("error")) {
      validateEmail();
    }
  });

  // Toast notification functions
  window.showToast = function (type, title, message) {
    const toast = document.getElementById("toast");
    const toastContent = document.getElementById("toast-content");
    const toastIcon = document.getElementById("toast-icon");
    const toastTitle = document.getElementById("toast-title");
    const toastMessage = document.getElementById("toast-message");

    // Set content
    toastTitle.textContent = title;
    toastMessage.textContent = message;

    // Set styles based on type
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

    // Show toast
    toast.classList.add("show");

    // Auto hide after 5 seconds
    setTimeout(hideToast, 5000);
  };

  window.hideToast = function () {
    const toast = document.getElementById("toast");
    toast.classList.remove("show");
  };

  // Set loading state
  function setLoading(loading) {
    submitBtn.disabled = loading;
    if (loading) {
      btnText.textContent = "Sending...";
      btnArrow.classList.add("hidden");
      btnSpinner.classList.remove("hidden");
      submitBtn.style.pointerEvents = "none";
    } else {
      btnText.textContent = "Send Reset Link";
      btnArrow.classList.remove("hidden");
      btnSpinner.classList.add("hidden");
      submitBtn.style.pointerEvents = "auto";
    }
  }

  // Parse API error response
  function getErrorMessage(data) {
    // Check for validation errors with details array
    if (
      data.details &&
      Array.isArray(data.details) &&
      data.details.length > 0
    ) {
      return data.details.join(", ");
    }
    // Check for error message
    if (data.error) {
      return data.error;
    }
    // Check for message
    if (data.message) {
      return data.message;
    }
    // Default message
    return "Something went wrong. Please try again.";
  }

  // Show success state
  function showSuccess(email) {
    form.classList.add("hidden");
    sentEmail.textContent = email;
    successState.classList.remove("hidden");
  }

  // Reset form to try again
  window.resetForm = function () {
    successState.classList.add("hidden");
    form.classList.remove("hidden");
    emailInput.value = "";
    clearError(emailInput, emailError);
  };

  // Form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validate email
    const isEmailValid = validateEmail();

    if (!isEmailValid) {
      // Shake the form on validation error
      form.classList.add("animate-shake");
      setTimeout(() => form.classList.remove("animate-shake"), 500);
      return;
    }

    // Set loading state
    setLoading(true);

    const email = emailInput.value.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email,
        }),
      });

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        showToast("error", "Error", "Invalid response from server");
        return;
      }

      console.log("API Response:", {
        status: response.status,
        ok: response.ok,
        data,
      });

      // Check for success
      if (data.status === true || data.success === true || response.ok) {
        showToast(
          "success",
          "Email Sent!",
          "Check your inbox for the reset link"
        );
        showSuccess(email);
      } else {
        // Handle error response
        const errorMessage = getErrorMessage(data);
        console.log("Error message to show:", errorMessage);
        showToast("error", "Request Failed", errorMessage);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      showToast(
        "error",
        "Connection Error",
        "Unable to connect to server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  });

  // Handle enter key on input
  emailInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      form.dispatchEvent(new Event("submit"));
    }
  });

  // Add shake animation style
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
    .animate-shake { animation: shake 0.5s ease-in-out; }
  `;
  document.head.appendChild(style);
})();



