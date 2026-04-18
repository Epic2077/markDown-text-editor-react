import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Home from "./pages/Home";
import NewNote from "./pages/NewNote";
import Note from "./pages/Note";
import NoteEditor from "./pages/EditNote";

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="new" element={<NewNote />} />
          <Route path="note/:id" element={<Note />} />
          <Route path="edit/:id" element={<NoteEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
