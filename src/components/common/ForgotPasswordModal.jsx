import { useState } from "react";
import { FaTimes, FaEnvelope, FaLock, FaCheckCircle, FaKey, FaShieldAlt } from "react-icons/fa";
import { forgotPassword, verifyOtp, resetPassword } from "../../services/authService";
import { toast } from "react-hot-toast";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");


  if (!isOpen) return null;

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("OTP sent to your email address.");
      setError("");
      setStep(2);
    } catch (err) {
      setError(err);
    } finally {

      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      toast.success("OTP verified successfully.");
      setError("");
      setStep(3);
    } catch (err) {
      setError(err);
    } finally {

      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      await resetPassword({
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      toast.success("Password reset successfully. You can now login.");
      setError("");
      onClose();
      // Reset state for next time
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err);
    } finally {

      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"

                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                />
              </div>
              {error && step === 1 && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold animate-in fade-in duration-300">{error}</p>}
              {!error && <p className="text-slate-500 text-[10px] italic ml-1">We'll send a 6-digit verification code to this email.</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Verification Code</label>
              <div className="relative group">
                <FaShieldAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="Enter 6-digit OTP"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all tracking-[0.5em] font-mono text-center font-bold"

                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError("");
                  }}
                  maxLength={6}
                />
              </div>
              {error && step === 2 && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold animate-in fade-in duration-300">{error}</p>}
              <div className="flex justify-between items-center px-1">
                <p className="text-slate-500 text-[10px]">OTP sent to {email}</p>

                <button type="button" onClick={() => setStep(1)} className="text-blue-500 text-[10px] hover:underline">Change Email</button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleResetSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"

                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                />

              </div>
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative group">
                <FaCheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"

                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                />
              </div>
              {error && step === 3 && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold animate-in fade-in duration-300">{error}</p>}
            </div>

            <div className="flex items-center gap-2 px-1">
              <input 
                type="checkbox" 
                id="show-pass" 
                checked={showPassword} 
                onChange={() => setShowPassword(!showPassword)}
                className="rounded border-slate-200 bg-white text-blue-600 focus:ring-blue-500/20"

              />
              <label htmlFor="show-pass" className="text-slate-500 text-[10px] cursor-pointer">Show Passwords</label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={() => !loading && onClose()}
      ></div>

      
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white">

          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500 border border-blue-500/20 shadow-inner">
              <FaKey className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Reset Access</h3>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-0.5">Secure Password Recovery</p>
            </div>

          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <FaTimes />
          </button>

        </div>

        {/* PROGRESS BAR */}
        <div className="h-1 w-full bg-slate-100 flex">

          <div className={`h-full bg-blue-600 transition-all duration-500 ${step >= 1 ? 'w-1/3' : 'w-0'}`}></div>
          <div className={`h-full bg-blue-600 transition-all duration-500 ${step >= 2 ? 'w-1/3' : 'w-0'}`}></div>
          <div className={`h-full bg-blue-600 transition-all duration-500 ${step >= 3 ? 'w-1/3' : 'w-0'}`}></div>
        </div>

        {/* BODY */}
        <div className="p-8">
          {renderStep()}
        </div>

        {/* FOOTER */}
        <div className="px-8 py-4 bg-slate-50 text-center">
          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
            Identity Protection System • Energypac Security
          </p>
        </div>

      </div>
    </div>
  );
}
