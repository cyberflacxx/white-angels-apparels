import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEye, faEyeSlash, faLock, faShieldHeart } from "@fortawesome/free-solid-svg-icons";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AppButton } from "../components/UI";
import { api } from "../lib/api";
import { setAdminToken } from "../lib/adminAuth";

const passwordRules = [
  { key: "length", label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { key: "lowercase", label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { key: "digit", label: "One digit", test: (value: string) => /\d/.test(value) },
  { key: "special", label: "One special character", test: (value: string) => /[!@#$%^&*()_+\-=]/.test(value) }
];

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function login() {
    setError("");
    setSubmitting(true);
    try {
      const response = await api.post("/admin/auth/login", { email, password, remember });
      setAdminToken(response.data.token);
      navigate("/admin");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Login failed. Check the admin email and password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-logo"><img src="/images/site/logo-white-angels.png" alt="White Angels logo" /></span>
          <div>
            <strong>White Angels Apparels</strong>
            <p>Admin Portal</p>
          </div>
        </div>
        <div className="auth-card__heading">
          <FontAwesomeIcon icon={faLock} />
          <h1>Admin Login</h1>
          <p>Use verified administrator credentials to enter the White Angels control area.</p>
        </div>
        <div className="form-stack">
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
          </label>
          <label className="field password-field">
            <span>Password</span>
            <div className="password-field__control">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
              <button type="button" className="password-field__toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </label>
          <label className="auth-checkbox">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            <span>Remember this session on this device</span>
          </label>
          {error && <div className="error-card">{error}</div>}
          <AppButton onClick={login} disabled={submitting}>{submitting ? "Logging in..." : "Login"}</AppButton>
        </div>
        <div className="auth-links">
          <Link to="/admin/register">Register Admin Account</Link>
          <Link to="/" className="auth-links__back"><FontAwesomeIcon icon={faArrowLeft} /> Back to Main Site</Link>
        </div>
      </section>
    </main>
  );
}

export function AdminRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    registrationKey: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const passwordStatus = useMemo(
    () => passwordRules.map((rule) => ({ ...rule, met: rule.test(form.password) })),
    [form.password]
  );

  async function register() {
    setError("");
    setSubmitting(true);
    try {
      const response = await api.post("/admin/auth/register", form);
      navigate("/admin/register/verify", {
        state: {
          email: response.data.email,
          maskedEmail: response.data.maskedEmail
        }
      });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Registration could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card auth-card--wide">
        <div className="auth-card__brand">
          <span className="auth-logo"><img src="/images/site/logo-white-angels.png" alt="White Angels logo" /></span>
          <div>
            <strong>White Angels Apparels</strong>
            <p>Admin Registration</p>
          </div>
        </div>
        <div className="auth-card__heading">
          <FontAwesomeIcon icon={faShieldHeart} />
          <h1>Register Admin Account</h1>
          <p>Create a pending admin registration and verify it through your email OTP.</p>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>First Name</span>
            <input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          </label>
          <label className="field">
            <span>Surname</span>
            <input value={form.surname} onChange={(event) => setForm({ ...form, surname: event.target.value })} />
          </label>
          <label className="field span-2">
            <span>Email</span>
            <input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="field password-field">
            <span>Password</span>
            <div className="password-field__control">
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" />
              <button type="button" className="password-field__toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </label>
          <label className="field password-field">
            <span>Confirm Password</span>
            <div className="password-field__control">
              <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} autoComplete="new-password" />
              <button type="button" className="password-field__toggle" aria-label={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword((current) => !current)}>
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </label>
          <label className="field span-2">
            <span>Admin Registration Key</span>
            <input type="password" value={form.registrationKey} onChange={(event) => setForm({ ...form, registrationKey: event.target.value })} />
          </label>
        </div>
        <div className="password-rules">
          {passwordStatus.map((rule) => (
            <span key={rule.key} className={rule.met ? "password-rules__item password-rules__item--met" : "password-rules__item"}>
              {rule.label}
            </span>
          ))}
        </div>
        {error && <div className="error-card">{error}</div>}
        <div className="auth-actions">
          <AppButton onClick={register} disabled={submitting}>{submitting ? "Submitting..." : "Create Pending Account"}</AppButton>
          <Link to="/admin/login" className="btn btn--secondary">Back to Login</Link>
        </div>
      </section>
    </main>
  );
}

export function AdminRegisterVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as { email?: string; maskedEmail?: string } | null) ?? null;
  const [email, setEmail] = useState(state?.email ?? "");
  const [maskedEmail, setMaskedEmail] = useState(state?.maskedEmail ?? "");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function verifyAccount() {
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const response = await api.post("/admin/auth/register/verify", { email, otpCode });
      setMessage(response.data.message || "Account Created Successfully");
      window.setTimeout(() => navigate("/admin/login"), 1200);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendOtp() {
    setError("");
    setMessage("");
    try {
      const response = await api.post("/admin/auth/register/resend", { email });
      setMaskedEmail(response.data.maskedEmail ?? maskedEmail);
      setMessage(response.data.message || "Verification code resent.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "The verification code could not be resent.");
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-card__brand">
          <span className="auth-logo"><img src="/images/site/logo-white-angels.png" alt="White Angels logo" /></span>
          <div>
            <strong>White Angels Apparels</strong>
            <p>Email Verification</p>
          </div>
        </div>
        <div className="auth-card__heading">
          <FontAwesomeIcon icon={faShieldHeart} />
          <h1>Verify Your Email</h1>
          <p>We sent a verification code to <strong>{maskedEmail || "your email address"}</strong>.</p>
        </div>
        <div className="form-stack">
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="field">
            <span>OTP Code</span>
            <input inputMode="numeric" maxLength={6} value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
          </label>
          {error && <div className="error-card">{error}</div>}
          {message && <div className="status-banner">{message}</div>}
          <div className="auth-actions">
            <AppButton onClick={verifyAccount} disabled={submitting}>{submitting ? "Verifying..." : "Verify Account"}</AppButton>
            <button type="button" className="btn btn--secondary" onClick={resendOtp}>Resend OTP</button>
            <Link to="/admin/register" className="btn btn--soft">Back</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
