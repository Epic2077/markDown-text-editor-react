import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Link2, LoaderCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AcceptShare() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(
    token ? "" : "This share link is incomplete.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    void supabase
      .rpc("accept_note_share_link", { p_token: token })
      .then(({ data, error: acceptError }) => {
        if (acceptError) {
          setError(acceptError.message);
          return;
        }
        const accepted = Array.isArray(data) ? data[0] : data;
        if (!accepted?.note_id) {
          setError("This share link is invalid or revoked.");
          return;
        }
        navigate(`/note/${accepted.note_id}`, { replace: true });
      });
  }, [navigate, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="text-center">
        <Link2 className="mx-auto mb-4 h-8 w-8 text-blue-400" />
        {error ? (
          <>
            <h1 className="text-lg font-semibold">Share link unavailable</h1>
            <p className="mt-2 text-sm text-red-400">{error}</p>
          </>
        ) : (
          <>
            <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin text-neutral-500" />
            <p className="text-sm text-neutral-400">
              Connecting you to the note...
            </p>
          </>
        )}
      </div>
    </main>
  );
}
