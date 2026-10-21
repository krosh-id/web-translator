import React, { useEffect, useState } from "react";
import axios from "axios";

const API_KEY = process.env.REACT_APP_YANDEX_DICTIONARY_KEY;
const API_URL = "https://dictionary.yandex.net/api/v1/dicservice.json/lookup";

export default function Translate({ text }) {
  const [result, setResult] = useState({ input: "", translated: "", status: "" });

  useEffect(() => {
    const word = text.trim();
    let active = true;
    const source = axios.CancelToken.source();
    setResult({ input: text, translated: "", status: "" });
    if (!word) return () => { active = false; source.cancel(); };
    if (!API_KEY) {
      setResult({ input: text, translated: "", status: "Не настроен ключ Яндекс.Словаря." });
      return () => { active = false; source.cancel(); };
    }
    const timer = setTimeout(async () => {
      setResult({ input: text, translated: "", status: "Переводим…" });
      try {
        const { data } = await axios.get(API_URL, {
          params: { key: API_KEY, lang: "ru-en", text: word, ui: "ru" },
          cancelToken: source.token,
          timeout: 15000
        });
        const translated = data.def && data.def[0] && data.def[0].tr &&
          data.def[0].tr[0] && data.def[0].tr[0].text;
        if (active) setResult({ input: text, translated: translated || "",
          status: translated ? "" : "Перевод не найден. Введите другое русское слово." });
      } catch (error) {
        if (!active || axios.isCancel(error)) return;
        const code = error.response && error.response.data && error.response.data.code;
        let status = "Не удалось получить перевод. Проверьте соединение и повторите ввод.";
        if (code === 401 || code === 402) status = "Ключ Яндекс.Словаря недействителен или заблокирован.";
        if (code === 403 || code === 404 || code === 429) status = "Превышен лимит запросов. Повторите позже.";
        setResult({ input: text, translated: "", status });
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); source.cancel(); };
  }, [text]);

  const current = result.input === text && text.trim();
  return (
    <section aria-label="Перевод на английский">
      <h1 aria-live="polite">{current ? result.translated : ""}</h1>
      <p role="status">{current ? result.status : ""}</p>
    </section>
  );
}