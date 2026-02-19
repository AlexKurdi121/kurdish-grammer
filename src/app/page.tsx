"use client";

import { useState, useRef } from "react";

export default function Page() {
  const [dark, setDark] = useState(true);
  const [language, setLanguage] = useState<"ku" | "en">("ku"); // default Kurdish
  const [corrected, setCorrected] = useState("");
  const [cachedCorrected, setCachedCorrected] = useState("");
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const isRTL = language === "ku";

  const getText = () => editorRef.current?.innerText || "";

  const highlightWords = (wrongWords: string[]) => {
    if (!editorRef.current) return;

    let text = editorRef.current.innerText;

    wrongWords.forEach((word) => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "gu");

      text = text.replace(
        regex,
        `<span class="highlight">${word}</span>`
      );
    });

    editorRef.current.innerHTML = text;
  };

  const handleCheck = async () => {
    const text = getText();
    if (!text.trim()) return;

    setLoading(true);
    setCorrected("");

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, language }),
      });

      const data = await res.json();

      if (data.wrong) {
        highlightWords(data.wrong);
        setCachedCorrected(data.corrected);
      }
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const handleCorrect = () => {
    if (cachedCorrected) {
      setCorrected(cachedCorrected);
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`min-h-screen transition-all duration-500 ${
        dark
          ? "bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white"
          : "bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 text-gray-800"
      }`}
    >
      <style>
        {`
          .highlight {
            background-color: yellow;
            color: black;
            padding: 2px 4px;
            border-radius: 6px;
          }

          .editor:empty:before {
            content: attr(data-placeholder);
            color: gray;
            pointer-events: none;
          }
        `}
      </style>

      <div className="max-w-6xl mx-auto p-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">
            AI Grammar Checker ✨
          </h1>

          <div className="flex gap-3">

            {/* Language Toggle */}
            <button
              onClick={() =>
                setLanguage(language === "ku" ? "en" : "ku")
              }
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
            >
              {language === "ku" ? "English EN" : "کوردی KR"}
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => setDark(!dark)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition"
            >
              {dark ? "Light ☀️" : "Dark 🌙"}
            </button>
          </div>
        </div>

        {/* TWO BOXES */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* INPUT */}
          <div>
            <h2 className="text-xl font-semibold mb-3">
              {language === "ku" ? "نووسینی تۆ" : "Your Text"}
            </h2>

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder={
                language === "ku"
                  ? "لێرە دەق بنووسە..."
                  : "Type your text here..."
              }
              className={`editor min-h-[260px] p-6 rounded-2xl shadow-2xl border-2 focus:outline-none transition ${
                dark
                  ? "bg-gray-800 border-yellow-400"
                  : "bg-white border-yellow-500"
              } ${isRTL ? "text-right" : "text-left"}`}
            ></div>

            <div className="flex gap-4 mt-6">

              <button
                onClick={handleCheck}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-xl hover:scale-105 transition disabled:opacity-50"
              >
                {loading
                  ? language === "ku"
                    ? "چاوەڕوانبە..."
                    : "Checking..."
                  : language === "ku"
                  ? "پشکنین 🟡"
                  : "Check 🟡"}
              </button>

              <button
                onClick={handleCorrect}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:scale-105 transition"
              >
                {language === "ku" ? "ڕاستکردنەوە ✅" : "Correct ✅"}
              </button>

            </div>
          </div>

          {/* OUTPUT */}
          <div>
            <h2 className="text-xl font-semibold mb-3">
              {language === "ku"
                ? "دەقی ڕاستکراو"
                : "Corrected Result"}
            </h2>

            <div
              className={`min-h-[260px] p-6 rounded-2xl shadow-2xl border-2 transition ${
                dark
                  ? "bg-gray-800 border-green-400 text-green-300"
                  : "bg-white border-green-500 text-green-700"
              } ${isRTL ? "text-right" : "text-left"}`}
            >
              {corrected ||
                (language === "ku"
                  ? "ئەنجامە ڕاستکراوەکان لێرە دەردەکەون..."
                  : "Corrected text will appear here...")}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
