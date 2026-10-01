import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, LoaderCircle } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export default function Auth({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === "login";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!isSupabaseConfigured) {
      setError(
        "Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local first.",
      );
      return;
    }

    setSubmitting(true);
    const result = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (isLogin) {
      const from = (location.state as { from?: string } | null)?.from || "/";
      navigate(from, { replace: true });
    } else if (result.data.session) {
      navigate("/", { replace: true });
    } else {
      setMessage("Check your email to confirm your account, then sign in.");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-5">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-neutral-500 mt-2">
            {isLogin
              ? "Continue building your knowledge base."
              : "Keep your notes synced wherever you work."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl shadow-black/20"
        >
          <label className="block text-sm text-neutral-300">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white outline-none focus:border-blue-500"
            />
          </label>
          <label className="block text-sm text-neutral-300">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white outline-none focus:border-blue-500"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          <button
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-2.5 font-semibold transition-colors"
          >
            {submitting ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {isLogin ? "Sign in" : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link
            to={isLogin ? "/signup" : "/login"}
            className="text-blue-400 hover:text-blue-300"
          >
            {isLogin ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </div>
    </main>
  );
}
