const lab = document.querySelector("#lab");
const algorithmSelect = document.querySelector("#algorithm");
const sizeSelect = document.querySelector("#size");
const speedSelect = document.querySelector("#speed");
const chart = document.querySelector("#chart");
const progress = document.querySelector("#progress");
const description = document.querySelector("#description");
const stepCounter = document.querySelector("#step-counter");
const comparisonCount = document.querySelector("#comparisons");
const writeCount = document.querySelector("#writes");
const playButton = document.querySelector("#play");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const resetButton = document.querySelector("#reset");

let input = [42, 75, 32, 94, 56, 20, 64, 85, 47, 70, 30, 53];
let timeline = [];
let position = 0;
let playing = false;
let timer;
let bars = [];
let scale = 1;

function shuffledValues(size) {
  const values = Array.from({ length: size }, (_, index) => Math.round(12 + index * 84 / (size - 1)));
  for (let index = values.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [values[index], values[other]] = [values[other], values[index]];
  }
  return values;
}

function prepareChart() {
  chart.style.setProperty("--columns", input.length);
  chart.classList.toggle("dense", input.length > 20);
  scale = Math.max(...input);
  bars = input.map(() => {
    const column = document.createElement("span");
    const bar = document.createElement("span");
    const number = document.createElement("span");
    column.className = "bar-column";
    bar.className = "bar";
    number.className = "bar-number";
    column.append(bar, number);
    return { column, bar, number };
  });
  chart.replaceChildren(...bars.map(({ column }) => column));
}

function describe(frame) {
  const [left, right] = frame.indices;
  switch (frame.type) {
    case "compare":
      return `比較第 ${left + 1} 格的 ${frame.values[left]} 和第 ${right + 1} 格的 ${frame.values[right]}。`;
    case "swap":
      return `交換第 ${left + 1} 格和第 ${right + 1} 格。`;
    case "write":
      return `將 ${frame.values[left]} 寫入第 ${left + 1} 格。`;
    case "settle":
      return frame.indices.length === 1
        ? `第 ${left + 1} 格的 ${frame.values[left]} 已到達最終位置。`
        : `${frame.indices.length} 個值已到達最終位置。`;
    case "done":
      return "排序完成，所有值已由小到大排列。";
    default:
      return "資料已就緒。按播放或下一步開始。";
  }
}

function render() {
  const frame = timeline[position];
  frame.values.forEach((value, index) => {
    const { column, bar, number } = bars[index];
    let state = frame.settled.includes(index) ? "settled" : "";
    if (frame.indices.includes(index)) {
      if (frame.type === "compare") state = "compare";
      if (frame.type === "swap" || frame.type === "write") state = "swap";
    }
    bar.className = state ? `bar ${state}` : "bar";
    bar.style.setProperty("--height", `${value / scale * 100}%`);
    number.textContent = value;
    column.title = `第 ${index + 1} 格：${value}`;
  });

  const finalStep = timeline.length - 1;
  chart.setAttribute("aria-label", `長條排序圖，由左至右：${frame.values.join("、")}`);
  stepCounter.textContent = `步驟 ${position} / ${finalStep}`;
  progress.max = finalStep;
  progress.value = position;
  description.textContent = describe(frame);
  comparisonCount.textContent = frame.comparisons;
  writeCount.textContent = frame.writes;
  previousButton.disabled = position === 0;
  nextButton.disabled = position === finalStep;
  resetButton.disabled = position === 0 && !playing;
  playButton.textContent = playing ? "Ⅱ 暫停" : position === finalStep ? "↻ 重播" : "▶ 播放";
}

function stopPlayback() {
  clearTimeout(timer);
  playing = false;
  description.setAttribute("aria-live", "polite");
}

function move(offset) {
  position = Math.min(Math.max(position + offset, 0), timeline.length - 1);
  if (position === timeline.length - 1) stopPlayback();
  render();
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    move(1);
    if (playing) schedule();
  }, Number(speedSelect.value));
}

function reset() {
  stopPlayback();
  position = 0;
  render();
}

function loadTimeline() {
  stopPlayback();
  const algorithm = sortingAlgorithms.find(({ id }) => id === algorithmSelect.value);
  timeline = buildTimeline(input, algorithm);

  for (const field of ["name", "english", "best", "average", "worst", "space", "stable", "strategy"]) {
    document.querySelector(`#note-${field}`).textContent = algorithm[field];
  }
  document.querySelector("#note-intro").textContent = algorithm.introduction;

  position = 0;
  prepareChart();
  render();
}

function shuffle() {
  input = shuffledValues(Number(sizeSelect.value));
  loadTimeline();
}

for (const { id, name } of sortingAlgorithms) {
  const option = document.createElement("option");
  option.value = id;
  option.textContent = name;
  algorithmSelect.append(option);
}
algorithmSelect.selectedIndex = 0;
sizeSelect.value = String(input.length);
loadTimeline();
lab.hidden = false;

algorithmSelect.addEventListener("change", loadTimeline);
sizeSelect.addEventListener("change", shuffle);
speedSelect.addEventListener("change", () => {
  if (playing) schedule();
});
document.querySelector("#shuffle").addEventListener("click", shuffle);
resetButton.addEventListener("click", reset);
previousButton.addEventListener("click", () => {
  stopPlayback();
  move(-1);
});
nextButton.addEventListener("click", () => {
  stopPlayback();
  move(1);
});
playButton.addEventListener("click", () => {
  if (playing) {
    stopPlayback();
    render();
    return;
  }
  if (position === timeline.length - 1) position = 0;
  playing = true;
  description.setAttribute("aria-live", "off");
  render();
  schedule();
});
