// Login Form Validation & API Integration
(function () {
  "use strict";

  // Get API base URL from config
  const API_BASE_URL =
    window.APP_CONFIG?.API_BASE_URL || "http://localhost:3000/api";

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const btnArrow = document.getElementById("btnArrow");
  const btnSpinner = document.getElementById("btnSpinner");
  const togglePassword = document.getElementById("togglePassword");
  const eyeIcon = document.getElementById("eyeIcon");
  const eyeOffIcon = document.getElementById("eyeOffIcon");

  // Validation patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordMinLength = 6;

  // Toggle password visibility
  togglePassword.addEventListener("click", function () {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    eyeIcon.classList.toggle("hidden");
    eyeOffIcon.classList.toggle("hidden");
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

  // Validate password
  function validatePassword() {
    const password = passwordInput.value;

    if (!password) {
      showError(passwordInput, passwordError, "Password is required");
      return false;
    }

    if (password.length < passwordMinLength) {
      showError(
        passwordInput,
        passwordError,
        `Password must be at least ${passwordMinLength} characters`
      );
      return false;
    }

    clearError(passwordInput, passwordError);
    return true;
  }

  // Real-time validation on blur
  emailInput.addEventListener("blur", validateEmail);
  passwordInput.addEventListener("blur", validatePassword);

  // Clear errors on input
  emailInput.addEventListener("input", function () {
    if (emailInput.classList.contains("error")) {
      validateEmail();
    }
  });

  passwordInput.addEventListener("input", function () {
    if (passwordInput.classList.contains("error")) {
      validatePassword();
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
      btnText.textContent = "Signing in...";
      btnArrow.classList.add("hidden");
      btnSpinner.classList.remove("hidden");
      submitBtn.style.pointerEvents = "none";
    } else {
      btnText.textContent = "Sign in to Dashboard";
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
    return "Invalid email or password";
  }

  // Form submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validate all fields
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isEmailValid || !isPasswordValid) {
      // Shake the form on validation error
      form.classList.add("animate-shake");
      setTimeout(() => form.classList.remove("animate-shake"), 500);
      return;
    }

    // Set loading state
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: emailInput.value.trim(),
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

      // Check for success (status: true or success: true)
      if (data.status === true || data.success === true) {
        showToast(
          "success",
          "Welcome back!",
          "Login successful. Redirecting..."
        );

        // Redirect after short delay
        setTimeout(function () {
          window.location.href = data.redirectUrl || "/dashboard";
        }, 1000);
      } else {
        // Handle error response - API returned status: false
        const errorMessage = getErrorMessage(data);
        console.log("Error message to show:", errorMessage);
        showToast("error", "Login Failed", errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
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
  [emailInput, passwordInput].forEach(function (input) {
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
})();
