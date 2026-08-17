import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hero } from "../components/Hero";
import { AppButton, Container, Field, Section } from "../components/UI";
import { api } from "../lib/api";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function login() {
    setError("");
    try {
      const response = await api.post("/admin/auth/login", { email, password });
      localStorage.setItem("wa-admin-token", response.data.token);
      navigate("/admin");
    } catch {
      setError("Login failed. Check the admin email and password.");
    }
  }
  return (
    <main>
      <Hero title="Admin Login" subtitle="Protected White Angels Apparels administration." image="/images/hero-admin-login.jpg" compact />
      <Section>
        <Container className="login-card">
          <div className="feature-card feature-card--small">
            <FontAwesomeIcon icon={faLock} />
            <h2>Administration</h2>
            <p>Use your production admin credentials to continue.</p>
          </div>
          <div className="form-stack">
            <Field label="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Field label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            {error && <div className="error-card">{error}</div>}
            <AppButton onClick={login}>Login</AppButton>
          </div>
        </Container>
      </Section>
    </main>
  );
}
