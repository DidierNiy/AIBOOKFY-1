import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [verificationTarget, setVerificationTarget] = useState<{
    email?: string;
    contact?: string;
  }>({});
  const location = useLocation();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(true);
  const [role, setRole] = useState<"traveler" | "hotel">("traveler");

  // State for all form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+254"); // Kenya country code
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setIsSignUp(params.get("mode") !== "signin");
    const roleParam = params.get("role");
    if (roleParam === "hotel" || roleParam === "traveler") {
      setRole(roleParam);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && role === "hotel") {
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
    }

    setErrorMsg("");
    try {
      if (isSignUp) {
        // Call register
        const response = await fetch(
          "http://localhost:5000/api/users/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              role: role === "hotel" ? "hotelManager" : "traveler",
              fullName: role === "hotel" ? fullName : undefined,
              contactNumber:
                role === "hotel" ? `${countryCode}${contactNumber}` : undefined,
            }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          setErrorMsg(data.message || "Registration failed");
          return;
        }
        // Registration successful
        if (role === "hotel") {
          // For hotels, start verification flow (server-side)
          const contact = `${countryCode}${contactNumber}`;
          setVerificationTarget({ email, contact });
          setShowVerifyModal(true);
          setVerifyMsg(
            `A verification code was sent to ${email} (check your email).`
          );
        } else {
          // Travelers go directly to chat
          navigate("/chat");
        }
      } else {
        // Call login
        try {
          await login(role, email, password);
        } catch (error) {
          setErrorMsg((error as Error).message || "Wrong email or password");
        }
      }
    } catch (error) {
      setErrorMsg((error as Error).message);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyMsg("");
    if (!enteredCode) {
      setVerifyMsg("Please enter the verification code.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/users/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verificationTarget.email,
          code: enteredCode,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setVerifyMsg(data.message || "Verification failed");
        return;
      }
      setShowVerifyModal(false);
      setEnteredCode("");
      setVerifyMsg("");
      navigate("/pricing");
    } catch (err) {
      setVerifyMsg("Verification failed. Please try again later.");
    }
  };

  const handleResendCode = async () => {
    setVerifyMsg("");
    try {
      const response = await fetch(
        "http://localhost:5000/api/users/resend-verification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: verificationTarget.email }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setVerifyMsg(data.message || "Could not resend code");
        return;
      }
      setVerifyMsg("A new verification code was sent (check your email).");
    } catch (err) {
      setVerifyMsg("Could not resend code. Try again later.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg("");
    if (!resetEmail) {
      setResetMsg("Please enter your email address.");
      return;
    }
    try {
      const response = await fetch(
        "http://localhost:5000/api/users/request-reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail }),
        }
      );
      const data = await response.json();
      setResetMsg(
        data.message || "If an account exists, a reset link has been sent."
      );
    } catch (err) {
      setResetMsg("Could not request password reset. Try again later.");
    }
  };

  const switchMode = () => {
    const newMode = isSignUp ? "signin" : "signup";
    navigate(`/auth?mode=${newMode}&role=${role}`);
  };

  return (
    <div className="h-full flex items-center justify-center bg-light-bg dark:bg-dark-bg p-4">
      <div className="w-full max-w-md bg-light-card dark:bg-dark-card rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-2">
          {isSignUp ? "Create Your Account" : "Welcome Back"}
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          Get started with AIBookify today.
        </p>

        <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-dark-surface p-1 rounded-lg mb-6">
          <button
            onClick={() => setRole("traveler")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              role === "traveler"
                ? "bg-white dark:bg-dark-card shadow"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            I'm a Traveler
          </button>
          <button
            onClick={() => setRole("hotel")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              role === "hotel"
                ? "bg-white dark:bg-dark-card shadow"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            I'm a Hotel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="text-red-600 text-sm text-center mb-2">
              {errorMsg}
            </div>
          )}
          {isSignUp && role === "hotel" && (
            <div>
              <label className="text-sm font-medium">Hotel Name / Agent</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0"
                placeholder="e.g., Bujumbura Resort"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0"
              placeholder="you@example.com"
            />
          </div>
          {isSignUp && role === "hotel" && (
            <div>
              <label className="text-sm font-medium">Contact Number</label>
              <div className="flex mt-1">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="rounded-l-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0"
                >
                  <option>+254</option>
                  <option>+257</option>
                  <option>+253</option>
                  <option>+1</option>
                  <option>+44</option>
                  <option>+91</option>
                </select>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                  className="block w-full rounded-r-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0"
                  placeholder="79 123 456"
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0"
              placeholder="••••••••"
            />
          </div>
          {isSignUp && role === "hotel" && (
            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0"
                placeholder="••••••••"
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
          >
            {isSignUp
              ? `Sign Up as ${role === "hotel" ? "a Hotel" : "a Traveler"}`
              : "Sign In"}
          </button>
          {!isSignUp && (
            <div className="text-right mt-2">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setShowResetModal(true)}
              >
                Forgot password?
              </button>
            </div>
          )}
        </form>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={switchMode}
            className="font-medium text-primary hover:underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>

        {/* Password Reset Modal */}
        {showResetModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg w-full max-w-sm relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setShowResetModal(false);
                  setResetEmail("");
                  setResetMsg("");
                }}
              >
                &times;
              </button>
              <h3 className="text-lg font-bold mb-2">Reset Password</h3>
              <form onSubmit={handleResetPassword} className="space-y-3">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0"
                  placeholder="Enter your email address"
                />
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2 rounded-md font-semibold"
                >
                  Send Reset Link
                </button>
                {resetMsg && (
                  <div className="text-sm text-center mt-2 text-green-600">
                    {resetMsg}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
        {/* Verification Modal for Hotel Registration */}
        {showVerifyModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-lg w-full max-w-sm relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setShowVerifyModal(false);
                  setEnteredCode("");
                  setVerifyMsg("");
                }}
              >
                &times;
              </button>
              <h3 className="text-lg font-bold mb-2">Verify Your Account</h3>
              <p className="text-sm text-gray-600 mb-3">{verifyMsg}</p>
              <form onSubmit={handleVerifySubmit} className="space-y-3">
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  required
                  className="w-full rounded-md bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary focus:bg-white dark:focus:bg-dark-surface focus:ring-0"
                  placeholder="Enter 6-digit code"
                />
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2 rounded-md font-semibold"
                >
                  Verify
                </button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={handleResendCode}
                  >
                    Resend code
                  </button>
                  <div className="text-sm text-red-600">
                    {verifyMsg && verifyMsg.includes("Invalid")
                      ? verifyMsg
                      : null}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
