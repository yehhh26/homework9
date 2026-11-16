function compare(left, right) {
  return { type: "compare", indices: [left, right] };
}

function* swap(values, left, right) {
  if (left === right) return;
  [values[left], values[right]] = [values[right], values[left]];
  yield { type: "swap", indices: [left, right] };
}

function settle(...indices) {
  return { type: "settle", indices };
}

function* bubbleSort(values) {
  for (let end = values.length - 1; end > 0; end--) {
    let changed = false;
    for (let index = 0; index < end; index++) {
      yield compare(index, index + 1);
      if (values[index] > values[index + 1]) {
        yield* swap(values, index, index + 1);
        changed = true;
      }
    }
    if (!changed) {
      yield settle(...Array.from({ length: end + 1 }, (_, index) => index));
      return;
    }
    yield settle(end);
  }
  if (values.length) yield settle(0);
}

function* selectionSort(values) {
  for (let start = 0; start < values.length; start++) {
    let smallest = start;
    for (let index = start + 1; index < values.length; index++) {
      yield compare(smallest, index);
      if (values[index] < values[smallest]) smallest = index;
    }
    yield* swap(values, start, smallest);
    yield settle(start);
  }
}

function* insertionSort(values) {
  for (let start = 1; start < values.length; start++) {
    for (let index = start; index > 0; index--) {
      yield compare(index - 1, index);
      if (values[index - 1] <= values[index]) break;
      yield* swap(values, index - 1, index);
    }
  }
  if (values.length) yield settle(...values.keys());
}

function* quickSort(values, start = 0, end = values.length - 1) {
  if (start > end) return;
  if (start === end) {
    yield settle(start);
    return;
  }

  let boundary = start;
  for (let index = start; index < end; index++) {
    yield compare(index, end);
    if (values[index] <= values[end]) {
      yield* swap(values, index, boundary);
      boundary++;
    }
  }
  yield* swap(values, boundary, end);
  yield settle(boundary);
  yield* quickSort(values, start, boundary - 1);
  yield* quickSort(values, boundary + 1, end);
}

const sortingAlgorithms = [
  {
    id: "bubble",
    name: "氣泡排序",
    english: "Bubble sort",
    introduction: "反覆比較相鄰元素，讓較大的值逐步移到右側。每掃描一輪，尚未定位的最大值就會到達最終位置。",
    strategy: "留意每一輪的右端。若整輪都沒有交換，就可以提早結束。",
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: "穩定",
    steps: bubbleSort,
  },
  {
    id: "selection",
    name: "選擇排序",
    english: "Selection sort",
    introduction: "掃描尚未排序的區間，找出最小值並放到區間最左側。已定位的區間由左往右增長。",
    strategy: "觀察每輪掃描做了多少次比較。即使輸入已排序，演算法仍會掃描整個未排序區間。",
    best: "O(n²)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: "不穩定",
    steps: selectionSort,
  },
  {
    id: "insertion",
    name: "插入排序",
    english: "Insertion sort",
    introduction: "從左到右處理資料，把下一個值逐步往左移，插進左側已排好的區間。",
    strategy: "留意比較何時停止。左鄰的值小於或等於目前元素時，這一輪就結束。前幾輪排好的區間仍可能被後面的元素插入。",
    best: "O(n)",
    average: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: "穩定",
    steps: insertionSort,
  },
  {
    id: "quick",
    name: "快速排序",
    english: "Quicksort",
    introduction: "每輪以區間最右邊的值為基準，把小於或等於基準的值移到左側，放好基準，再分別處理左右兩側。",
    strategy: "觀察基準確定位置後，下一輪的比較範圍如何縮小。若基準總落在區間端點，例如輸入已由小到大排序，會達到最差情況。",
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n²)",
    space: "平均 O(log n)／最差 O(n)",
    stable: "不穩定",
    steps: quickSort,
  },
];

function buildTimeline(input, algorithm) {
  const values = [...input];
  const settled = new Set();
  let comparisons = 0;
  let writes = 0;

  function frame(type, indices = []) {
    return { type, indices, values: [...values], settled: [...settled], comparisons, writes };
  }

  const frames = [frame("ready")];
  for (const { type, indices } of algorithm.steps(values)) {
    if (type === "compare") comparisons++;
    if (type === "swap") writes += 2;
    if (type === "write") writes++;
    if (type === "settle") indices.forEach((index) => settled.add(index));
    frames.push(frame(type, indices));
  }
  for (const index of values.keys()) settled.add(index);
  frames.push(frame("done"));
  return frames;
}
