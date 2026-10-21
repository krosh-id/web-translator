import "./styles.css";
import React, { useState } from "react";
import Field from "./components/field";
import Translate from "./components/translate";

export default function App() {
  const [text, setText] = useState("");
  return (
    <main>
      <Field label="Введите русское слово" value={text} onChange={setText} />
      <Translate text={text} />
      <footer><a href="https://yandex.ru/dev/dictionary/">Реализовано с помощью сервиса «Яндекс.Словарь»</a></footer>
    </main>
  );
}