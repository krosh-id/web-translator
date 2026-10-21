import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import axios from "axios";
process.env.REACT_APP_YANDEX_DICTIONARY_KEY = "test-key";
const App = require("../App").default;
const Translate = require("./translate").default;

jest.mock("axios", () => ({
  get: jest.fn(),
  isCancel: jest.fn(() => false),
  CancelToken: { source: () => ({ token: {}, cancel: jest.fn() }) }
}));

let container;
const response = text => ({ data: { def: [{ tr: [{ text }] }] } });
const renderWord = text => act(() => { ReactDOM.render(<Translate text={text} />, container); });
const tick = async () => {
  await act(async () => { jest.advanceTimersByTime(300); await Promise.resolve(); });
};

beforeEach(() => {
  jest.useFakeTimers();
  axios.get.mockReset();
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(() => {
  act(() => { ReactDOM.unmountComponentAtNode(container); });
  container.remove();
  jest.useRealTimers();
});

test("the app has exactly one input and one initially empty h1", () => {
  act(() => { ReactDOM.render(<App />, container); });
  expect(container.querySelectorAll("input")).toHaveLength(1);
  expect(container.querySelectorAll("h1")).toHaveLength(1);
  expect(container.querySelector("h1").textContent).toBe("");
  expect(axios.get).not.toHaveBeenCalled();
});

test("debounces input and requests the fixed ru-en direction", async () => {
  axios.get.mockResolvedValue(response("cat"));
  renderWord("кош");
  act(() => { jest.advanceTimersByTime(200); });
  renderWord("кошка");
  expect(axios.get).not.toHaveBeenCalled();
  await tick();
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get.mock.calls[0][1].params).toMatchObject({ lang: "ru-en", text: "кошка" });
  expect(container.querySelector("h1").textContent).toBe("cat");
});

test("clearing input clears translation and ignores a pending response", async () => {
  let resolve;
  axios.get.mockImplementation(() => new Promise(done => { resolve = done; }));
  renderWord("кошка");
  await tick();
  renderWord("");
  await act(async () => { resolve(response("cat")); await Promise.resolve(); });
  expect(container.querySelector("h1").textContent).toBe("");
  expect(container.querySelector('[role="status"]').textContent).toBe("");
});

test("a late response cannot replace the latest word", async () => {
  let resolveOld;
  axios.get.mockImplementationOnce(() => new Promise(done => { resolveOld = done; }))
    .mockResolvedValueOnce(response("house"));
  renderWord("кошка");
  await tick();
  renderWord("дом");
  await tick();
  await act(async () => { resolveOld(response("cat")); await Promise.resolve(); });
  expect(container.querySelector("h1").textContent).toBe("house");
});

test("unknown words show a separate status and empty h1", async () => {
  axios.get.mockResolvedValue({ data: { def: [] } });
  renderWord("фывапролд");
  await tick();
  expect(container.querySelector("h1").textContent).toBe("");
  expect(container.querySelector('[role="status"]').textContent).toContain("Перевод не найден");
});

test("invalid credentials show an error outside h1", async () => {
  axios.get.mockRejectedValue({ response: { data: { code: 401 } } });
  renderWord("кошка");
  await tick();
  expect(container.querySelector("h1").textContent).toBe("");
  expect(container.querySelector('[role="status"]').textContent).toContain("недействителен");
});
