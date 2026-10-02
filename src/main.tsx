import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Home from "./pages/Home";
import NewNote from "./pages/NewNote";
import Note from "./pages/Note";
import NoteEditor from "./pages/EditNote";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import AcceptShare from "./pages/AcceptShare";

declare global {
  interface Window {
    MonacoEnvironment: { getWorkerUrl: () => string };
  }
}

window.MonacoEnvironment = {
  getWorkerUrl: () =>
    URL.createObjectURL(
      new Blob(
        [
          'self.MonacoEnvironment={};importScripts("https://cdn.jsdelivr.net/npm/monaco-editor/min/vs/base/worker/workerMain.js");',
        ],
        {
          type: "text/javascript",
        },
      ),
    ),
};

console.info(
  "%cMarkdown Knowledge Base%c\nCreated by Ashkan Sadeghi\nGitHub: https://github.com/Epic2077\nWebsite: https://portfolio-ashkan.vercel.app/\nEmail: epic.2077.uni@gmail.com\nOpen source: https://github.com/Epic2077/markDown-text-editor-react",
  "color:#67e8f9;font-weight:700;font-size:14px",
  "color:inherit;font-weight:400;font-size:12px",
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/share/:token" element={<AcceptShare />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="new" element={<NewNote />} />
              <Route path="note/:id" element={<Note />} />
              <Route path="edit/:id" element={<NoteEditor />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
