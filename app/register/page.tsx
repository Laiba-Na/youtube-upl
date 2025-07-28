"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDarkMode } from "@/app/DarkModeContext";

export default function Register() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    general: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Validation regex (same as server-side for consistency)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: "", email: "", password: "", general: "" };

    if (!formData.name || formData.name.length < 2 || !/^[a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = "Name must be at least 2 characters long and contain only letters and spaces";
      isValid = false;
    }

    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password || !passwordRegex.test(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({ name: "", email: "", password: "", general: "" });

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors((prev) => ({ ...prev, general: errorData.error || "Registration failed" }));
        setIsLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, general: error.message || "Something went wrong" }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Left side (Welcome Back) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-primaryPurple to-primaryRed p-8 text-white">
        <h2 className="text-4xl font-bold mb-6 animate-fade-in-up">Welcome Back</h2>
        <p className="max-w-md text-center text-lg opacity-90">
          Already have an account? Sign in to manage and schedule your social media posts with ease.
        </p>
        <Link href="/login" className="mt-8">
          <button
            type="button"
            className="px-8 py-3 border-2 border-white rounded-full text-lg font-semibold hover:bg-white hover:text-primaryPurple transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            Sign In
          </button>
        </Link>
      </div>

      {/* Right side (Create Account) */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-10 transition-all duration-300">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <span className="w-4 h-4 rounded-full bg-primaryPurple animate-pulse"></span>
            <span className="w-4 h-4 rounded-full bg-highlightBlue animate-pulse delay-100"></span>
            <span className="w-4 h-4 rounded-full bg-primaryRed animate-pulse delay-200"></span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-textBlack dark:text-white mb-3 text-center">
            Create Your Account
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
            Join Youtube-upl to schedule your posts effortlessly
          </p>

          {errors.general && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-primaryRed text-primaryRed dark:text-red-400 px-4 py-3 mb-6 rounded-lg animate-shake">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-textBlack dark:text-gray-200 mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={`block w-full rounded-lg border ${errors.name ? 'border-primaryRed' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 p-3 text-textBlack dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-highlightBlue focus:border-highlightBlue transition-all duration-200 ${errors.name ? 'animate-shake' : ''}`}
                placeholder="Your Name"
                value={formData.name}
                onChange={handleInputChange}
              />
              {errors.name && (
                <p className="text-primaryRed dark:text-red-400 text-sm mt-2 animate-fade-in">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-textBlack dark:text-gray-200 mb-2"
              >
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`block w-full rounded-lg border ${errors.email ? 'border-primaryRed' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 p-3 text-textBlack dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-highlightBlue focus:border-highlightBlue transition-all duration-200 ${errors.email ? 'animate-shake' : ''}`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && (
                <p className="text-primaryRed dark:text-red-400 text-sm mt-2 animate-fade-in">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-textBlack dark:text-gray-200 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className={`block w-full rounded-lg border ${errors.password ? 'border-primaryRed' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 p-3 text-textBlack dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-highlightBlue focus:border-highlightBlue transition-all duration-200 ${errors.password ? 'animate-shake' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
              {errors.password && (
                <p className="text-primaryRed dark:text-red-400 text-sm mt-2 animate-fade-in">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primaryPurple text-white rounded-lg font-semibold hover:bg-highlightBlue dark:hover:bg-highlightBlue transition-all duration-300 shadow-md hover:shadow-lg focus:ring-2 focus:ring-highlightBlue focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="text-sm text-center mt-6 text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primaryPurple hover:text-highlightBlue dark:hover:text-highlightBlue transition-colors duration-200"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}