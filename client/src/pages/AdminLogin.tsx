import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hero } from "../components/Hero";
import { api } from "../lib/api";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  async function login() {
    const response = await api.post("/admin/auth/login", { email, password });
    localStorage.setItem("wa-admin-token", response.data.token);
    navigate("/admin");
  }
  return (
    <main>
      <Hero title="Admin Login" subtitle="Protected White Angels Apparels administration." image="/images/hero-admin-login.jpg" />
      <section className="section form-stack narrow"><input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} /><input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /><button onClick={login}>Login</button></section>
    </main>
  );
}
