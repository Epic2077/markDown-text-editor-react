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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route element={<ProtectedRoute />}>
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
