// Reset Password Form Validation & API Integration
(function () {
  "use strict";

  // Get API base URL from config
  const API_BASE_URL =
    window.APP_CONFIG?.API_BASE_URL || "http://localhost:3000/api";

  const form = document.getElementById("resetPasswordForm");
  const resetToken = document.getElementById("resetToken");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const passwordError = document.getElementById("password-error");
  const confirmPasswordError = document.getElementById("confirmPassword-error");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const btnArrow = document.getElementById("btnArrow");
  const btnSpinner = document.getElementById("btnSpinner");
  const successState = document.getElementById("successState");
  const reqLength = document.getElementById("req-length");

  // Toggle password visibility
  const togglePassword = document.getElementById("togglePassword");
  const eyeIcon = document.getElementById("eyeIcon");
  const eyeOffIcon = document.getElementById("eyeOffIcon");
  const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
  const eyeIconConfirm = document.getElementById("eyeIconConfirm");
  const eyeOffIconConfirm = document.getElementById("eyeOffIconConfirm");

  // Password requirements
  const minLength = 8;

  // Toggle password visibility
  togglePassword.addEventListener("click", function () {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    eyeIcon.classList.toggle("hidden");
    eyeOffIcon.classList.toggle("hidden");
  });

  toggleConfirmPassword.addEventListener("click", function () {
    const type = confirmPasswordInput.type === "password" ? "text" : "password";
    confirmPasswordInput.type = type;
    eyeIconConfirm.classList.toggle("hidden");
    eyeOffIconConfirm.classList.toggle("hidden");
  });

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

  // Check password requirements
  function checkRequirements(password) {
    const hasLength = password.length >= minLength;

    if (hasLength) {
      reqLength.classList.add("req-met");
    } else {
      reqLength.classList.remove("req-met");
    }

    return hasLength;
  }

  // Validate password
  function validatePassword() {
    const password = passwordInput.value;

    if (!password) {
      showError(passwordInput, passwordError, "Password is required");
      return false;
    }

    if (password.length < minLength) {
      showError(
        passwordInput,
        passwordError,
        `Password must be at least ${minLength} characters`
      );
      return false;
    }

    clearError(passwordInput, passwordError);
    return true;
  }

  // Validate confirm password
  function validateConfirmPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!confirmPassword) {
      showError(
        confirmPasswordInput,
        confirmPasswordError,
        "Please confirm your password"
      );
      return false;
    }

    if (password !== confirmPassword) {
      showError(
        confirmPasswordInput,
        confirmPasswordError,
        "Passwords do not match"
      );
      return false;
    }

    clearError(confirmPasswordInput, confirmPasswordError);
    return true;
  }

  // Real-time validation on blur
  passwordInput.addEventListener("blur", validatePassword);
  confirmPasswordInput.addEventListener("blur", validateConfirmPassword);

  // Check requirements on input
  passwordInput.addEventListener("input", function () {
    checkRequirements(passwordInput.value);
    if (passwordInput.classList.contains("error")) {
      validatePassword();
    }
    // Also validate confirm if it has value
    if (confirmPasswordInput.value) {
      validateConfirmPassword();
    }
  });

  confirmPasswordInput.addEventListener("input", function () {
    if (confirmPasswordInput.classList.contains("error")) {
      validateConfirmPassword();
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
      btnText.textContent = "Resetting...";
      btnArrow.classList.add("hidden");
      btnSpinner.classList.remove("hidden");
      submitBtn.style.pointerEvents = "none";
    } else {
      btnText.textContent = "Reset Password";
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
  function showSuccess() {
    form.classList.add("hidden");
    successState.classList.remove("hidden");
  }

  // Form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validate all fields
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    if (!isPasswordValid || !isConfirmPasswordValid) {
      // Shake the form on validation error
      form.classList.add("animate-shake");
      setTimeout(() => form.classList.remove("animate-shake"), 500);
      return;
    }

    // Get token
    const token = resetToken.value;
    if (!token) {
      showToast("error", "Error", "Invalid reset link. Please request a new one.");
      return;
    }

    // Set loading state
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          password: passwordInput.value,
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
          "Success!",
          "Your password has been reset"
        );
        showSuccess();
      } else {
        // Handle error response
        const errorMessage = getErrorMessage(data);
        console.log("Error message to show:", errorMessage);
        showToast("error", "Reset Failed", errorMessage);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      showToast(
        "error",
        "Connection Error",
        "Unable to connect to server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  });

  // Handle enter key on inputs
  [passwordInput, confirmPasswordInput].forEach(function (input) {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        form.dispatchEvent(new Event("submit"));
      }
    });
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

  // Check requirements on page load
  checkRequirements(passwordInput.value);
})();



