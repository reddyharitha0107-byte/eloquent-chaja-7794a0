"use client";

import { useEffect, useState, type FormEvent } from "react";
import { acceptInvite, AuthError, getSettings, getUser, handleAuthCallback, login, logout, MissingIdentityError, onAuthChange, requestPasswordRecovery, signup, updateUser, type User } from "@netlify/identity";
import { ArrowRight, Check, LayoutDashboard, Leaf, LoaderCircle, LockKeyhole, Mail, ShieldCheck, ShoppingBag, Store, Zap } from "lucide-react";
import type { Persona } from "@/lib/types";
import Dashboard from "./dashboard";

type AuthMode = "login" | "signup" | "forgot" | "reset" | "invite";

const roles = [
  { id: "operations" as const, title: "Admin / Operations", description: "Review the network, update retailers, and recognize your best sellers.", Icon: LayoutDashboard },
  { id: "merchant" as const, title: "Merchant", description: "Confirm inventory, manage orders, and keep your neighborhood stocked.", Icon: Store },
  { id: "customer" as const, title: "Customer", description: "Discover local stores, shop verified stock, and follow your orders.", Icon: ShoppingBag },
];

function authMessage(error: unknown) {
  if (error instanceof MissingIdentityError) return "Email login is not available on this deployment yet. Please contact the site owner.";
  if (error instanceof AuthError) {
    if (error.status === 401) return "Check your email and password, and confirm your email before signing in.";
    if (error.status === 403) return "This action is not allowed. Your email may need confirmation, or registration may be closed.";
    if (error.status === 422) return "Check your details. Use a valid email and a stronger password; an account may already exist.";
    if (error.status === 429) return "Too many attempts. Please wait before trying again.";
  }
  return "We could not complete that request. Please try again, or request a new email link.";
}

export default function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [selectedRole, setSelectedRole] = useState<Persona>("operations");
  const [mode, setMode] = useState<AuthMode>("login");
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [signupAllowed, setSignupAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthChange((event, nextUser) => {
      if (!active) return;
      setUser(nextUser);
      if (event === "logout" || event === "login" || event === "recovery") setPersona(null);
      if (event === "recovery") setMode("reset");
    });
    const expireSession = () => {
      setUser(null);
      setPersona(null);
      setMode("login");
      setError("Your session has expired. Sign in again to continue.");
    };
    window.addEventListener("nova-session-expired", expireSession);
    void (async () => {
      try {
        const callback = await handleAuthCallback();
        const currentUser = callback ? callback.user : await getUser();
        if (!active) return;
        setUser(currentUser);
        if (callback?.type === "recovery") setMode("reset");
        else if (callback?.type === "invite" && callback.token) { setInviteToken(callback.token); setMode("invite"); }
        else if (callback?.type === "confirmation") setMessage("Email confirmed. Choose a role to enter your workspace.");
      } catch (failure) {
        if (active) setError(authMessage(failure));
      } finally {
        if (active) setChecking(false);
      }
    })();
    void getSettings().then(settings => { if (active) setSignupAllowed(!settings.disableSignup); }).catch(() => {});
    return () => { active = false; unsubscribe(); window.removeEventListener("nova-session-expired", expireSession); };
  }, []);

  function changeMode(next: AuthMode) {
    setMode(next); setError(""); setMessage(""); setPassword("");
  }

  async function signOut() {
    await logout();
    setUser(null); setPersona(null); setPassword(""); setMode("login"); setMessage(""); setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "forgot") {
        await requestPasswordRecovery(email.trim());
        setMessage("If an account exists for this email, a password reset link is on its way. Check your inbox.");
      } else if (mode === "reset") {
        setUser(await updateUser({ password })); setMode("login");
        setMessage("Password updated. Choose a role to continue.");
      } else if (mode === "invite") {
        setUser(await acceptInvite(inviteToken, password)); setInviteToken(""); setMode("login");
      } else if (mode === "signup") {
        const created = await signup(email.trim(), password, { full_name: name.trim() });
        if (created.confirmedAt) setUser(created);
        else { setMode("login"); setMessage("Check your inbox and confirm your email before signing in."); }
      } else {
        setUser(await login(email.trim(), password));
      }
      setPassword("");
    } catch (failure) {
      setError(authMessage(failure));
    } finally { setBusy(false); }
  }

  if (user && persona && mode !== "reset" && mode !== "invite") return <Dashboard key={user.id} user={user} initialPersona={persona} onSignOut={signOut} />;

  const choosingRole = !!user && mode !== "reset" && mode !== "invite";
  const titles = { login: "Welcome to the neighborhood.", signup: "A better way to stay in sync.", forgot: "Let’s get you back in.", reset: "A fresh start, securely.", invite: "Your neighborhood is waiting." };

  return <main className="auth-shell">
    <section className="auth-story" aria-label="About NOVA SYNC">
      <a className="brand" href="/" aria-label="NOVA SYNC home"><span className="brand-symbol"><span>N</span><i /></span><div><strong>NOVA SYNC<span className="brand-period">.</span></strong><span>Local commerce, connected.</span></div></a>
      <div className="auth-story-content"><span className="eyebrow"><Leaf size={14} />THE NEIGHBORHOOD, CONNECTED</span><h1>One network.<br />Three perspectives.<br /><span>More possibility.</span></h1><p>From the shop counter to the control room, a little coordination goes a long way.</p>
        <div className="auth-network" aria-hidden="true"><span><Store size={25} /><small>MERCHANT</small></span><i /><span className="auth-network-core"><Zap size={31} fill="currentColor" /><small>NOVA SYNC</small></span><i /><span><ShoppingBag size={25} /><small>CUSTOMER</small></span></div>
        <div className="auth-story-note"><ShieldCheck size={20} /><div><strong>Your email. Your private demo.</strong><span>Live inventory, transparent orders, and a connected control room.</span></div></div>
      </div><p className="auth-story-footer">LOCAL COMMERCE. A LITTLE MORE HUMAN.</p>
    </section>
    <section className="auth-content" aria-label={choosingRole ? "Choose your demo role" : "Email authentication"}>
      <div className="auth-form-wrap">
        <span className="eyebrow">{choosingRole ? "YOUR WORKSPACE STARTS HERE" : "EMAIL ACCESS"}</span>
        <h2>{choosingRole ? "Choose your perspective." : titles[mode]}</h2>
        <p className="auth-intro">{choosingRole ? `Signed in as ${user.email}. Select how you’d like to explore NOVA SYNC.` : mode === "signup" ? "Create an account with your email. We’ll send you a confirmation link." : mode === "forgot" ? "Enter your email to receive a secure password reset link." : mode === "reset" || mode === "invite" ? "Set a password with at least eight characters to continue." : "Sign in with your email to access your connected workspace."}</p>
        {error && <div className="auth-feedback auth-error" role="alert">{error}</div>}
        {message && <div className="auth-feedback" role="status">{message}</div>}
        {checking ? <div className="auth-loading" role="status"><LoaderCircle size={22} className="spin" />Checking your session…</div> : choosingRole ? <>
          <fieldset className="role-picker"><legend className="sr-only">Choose a demo role</legend>{roles.map(role => <label className={`role-card ${selectedRole === role.id ? "role-selected" : ""}`} key={role.id}><input type="radio" name="role" value={role.id} checked={selectedRole === role.id} onChange={() => setSelectedRole(role.id)} /><span className="role-icon"><role.Icon size={23} /></span><span><strong>{role.title}</strong><small>{role.description}</small></span><span className="role-check">{selectedRole === role.id && <Check size={14} />}</span></label>)}</fieldset>
          <div className="demo-access-note"><ShieldCheck size={18} /><p><strong>Open demo role access.</strong> Every signed-in user can explore all three roles, including admin controls. Roles are perspectives, not privileged account permissions.</p></div>
          <button className="button button-primary auth-submit" onClick={() => setPersona(selectedRole)}>Enter {selectedRole === "operations" ? "control room" : selectedRole === "merchant" ? "merchant workspace" : "customer storefront"}<ArrowRight size={17} /></button>
          <button className="auth-text-button" disabled={busy} onClick={async () => { setBusy(true); try { await signOut(); } catch (failure) { setError(authMessage(failure)); } finally { setBusy(false); } }}>Sign out and use another email</button>
        </> : <form onSubmit={submit} className="auth-form">
          {mode === "signup" && <label htmlFor="auth-name">Your name<input id="auth-name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} required maxLength={100} disabled={busy} placeholder="How should we call you?" /></label>}
          {mode !== "reset" && mode !== "invite" && <label htmlFor="auth-email">Email address<span className="auth-input"><Mail size={17} /><input id="auth-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} placeholder="you@neighborhood.com" /></span></label>}
          {mode !== "forgot" && <label htmlFor="auth-password">{mode === "reset" || mode === "invite" ? "New password" : "Password"}<span className="auth-input"><LockKeyhole size={17} /><input id="auth-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 8} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} disabled={busy} placeholder={mode === "login" ? "Enter your password" : "At least 8 characters"} /></span></label>}
          {mode === "login" && <button type="button" className="auth-text-button auth-forgot" disabled={busy} onClick={() => changeMode("forgot")}>Forgot password?</button>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : mode === "reset" || mode === "invite" ? "Save password" : "Sign in with email"}</button>
          {mode === "login" && signupAllowed && <p className="auth-switch">New to the neighborhood? <button type="button" disabled={busy} onClick={() => changeMode("signup")}>Create an account</button></p>}
          {(mode === "signup" || mode === "forgot") && <button type="button" className="auth-text-button" disabled={busy} onClick={() => changeMode("login")}>Back to sign in</button>}
          <p className="auth-security"><ShieldCheck size={14} />Secure email access, powered by Netlify Identity.</p>
        </form>}
      </div>
    </section>
  </main>;
}
