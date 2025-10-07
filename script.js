const calcTypeElem = document.getElementById("calcType");
const dataTypeElem = document.getElementById("dataType");
const medianSeriesDiv = document.getElementById("medianSeriesDiv");
const medianSeriesElem = document.getElementById("medianSeries");
const simpleInputDiv = document.getElementById("simpleInputDiv");
const classFreqInputDiv = document.getElementById("classFreqInputDiv");
const resultDiv = document.getElementById("result");

function resetInputs() {
  resultDiv.textContent = "";
  const calcType = calcTypeElem.value;
  const dataType = dataTypeElem.value;
  medianSeriesDiv.classList.add("hidden");
  simpleInputDiv.classList.add("hidden");
  classFreqInputDiv.classList.add("hidden");
  if (!calcType || !dataType) return;
  if (calcType === "median") {
    medianSeriesDiv.classList.remove("hidden");
  }
  if (dataType === "simple") {
    simpleInputDiv.classList.remove("hidden");
  } else if (dataType === "classFreq") {
    classFreqInputDiv.classList.remove("hidden");
  }
}

function addClassRow() {
  const tbody = document.getElementById("classFreqBody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" class="classInterval" placeholder="e.g. 10-20" /></td>
    <td><input type="number" class="frequency" min="0" value="0" /></td>
    <td><button type="button" onclick="removeClassRow(this)"> - </button></td>
  `;
  tbody.appendChild(row);
}

function removeClassRow(btn) {
  const row = btn.closest("tr");
  row.remove();
}

function parseSimpleData() {
  const input = document.getElementById("simpleData").value;
  if (!input.trim()) return null;
  const nums = input.split(",").map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
  if (nums.length === 0) return null;
  return nums;
}

function parseClassFreq() {
  const intervalsElems = document.querySelectorAll(".classInterval");
  const freqElems = document.querySelectorAll(".frequency");
  let classes = [];
  let frequencies = [];
  for (let i = 0; i < intervalsElems.length; i++) {
    const cls = intervalsElems[i].value.trim();
    const freq = parseFloat(freqElems[i].value);
    if (!cls || isNaN(freq) || freq < 0) {
      return null;
    }
    frequencies.push(freq);
    const parts = cls.split("-");
    if (parts.length !== 2) return null;
    const lower = parseFloat(parts[0].trim());
    const upper = parseFloat(parts[1].trim());
    if (isNaN(lower) || isNaN(upper) || upper <= lower) return null;
    classes.push({ lower, upper });
  }
  return { classes, frequencies };
}

function meanSimple(nums) {
  const sum = nums.reduce((a,b) => a+b, 0);
  return sum / nums.length;
}
function medianSimple(nums) {
  nums.sort((a,b) => a-b);
  const mid = Math.floor(nums.length/2);
  if (nums.length % 2 === 0) {
    return (nums[mid-1] + nums[mid]) / 2;
  } else {
    return nums[mid];
  }
}
function modeSimple(nums) {
  const freq = {};
  nums.forEach(n => freq[n] = (freq[n] || 0) + 1);
  let maxFreq = 0;
  let modes = [];
  for (let num in freq) {
    if (freq[num] > maxFreq) {
      maxFreq = freq[num];
      modes = [Number(num)];
    } else if (freq[num] === maxFreq) {
      modes.push(Number(num));
    }
  }
  if (modes.length === Object.keys(freq).length) return "No mode";
  return modes.join(", ");
}
function meanClassFreq(classes, frequencies) {
  let sumFiXi = 0;
  let sumF = 0;
  for (let i=0; i<classes.length; i++) {
    const mid = (classes[i].lower + classes[i].upper) / 2;
    sumFiXi += mid * frequencies[i];
    sumF += frequencies[i];
  }
  return sumFiXi / sumF;
}
function medianClassFreq(classes, frequencies, seriesType) {
  let n = frequencies.reduce((a,b) => a + b, 0);
  let cumFreq = [];
  let sum = 0;
  for (let f of frequencies) {
    sum += f;
    cumFreq.push(sum);
  }
  if (seriesType === "discreteOdd" || seriesType === "discreteEven") {
    if (seriesType === "discreteOdd") {
      let medianPos = (n+1) / 2;
      for (let i=0; i<cumFreq.length; i++) {
        if (cumFreq[i] >= medianPos) {
          return (classes[i].lower + classes[i].upper) / 2;
        }
      }
    } else {
      let pos1 = n/2;
      let pos2 = pos1 + 1;
      let median1, median2;
      for (let i=0; i<cumFreq.length; i++) {
        if (!median1 && cumFreq[i] >= pos1) {
          median1 = (classes[i].lower + classes[i].upper) / 2;
        }
        if (!median2 && cumFreq[i] >= pos2) {
          median2 = (classes[i].lower + classes[i].upper) / 2;
          break;
        }
      }
      return (median1 + median2) / 2;
    }
  } else if (seriesType === "continuous") {
    let halfN = n/2;
    let medianClassIndex = cumFreq.findIndex(cf => cf >= halfN);
    let L = classes[medianClassIndex].lower;
    let F = medianClassIndex === 0 ? 0 : cumFreq[medianClassIndex - 1];
    let f = frequencies[medianClassIndex];
    let h = classes[medianClassIndex].upper - classes[medianClassIndex].lower;
    let median = L + ((halfN - F) / f) * h;
    return median;
  }
  return null;
}
function modeClassFreq(classes, frequencies) {
  let maxFreq = Math.max(...frequencies);
  let modeIndices = [];
  frequencies.forEach((f,i) => { if (f === maxFreq) modeIndices.push(i); });
  if (modeIndices.length !== 1) {
    return "No unique mode";
  }
  let i = modeIndices[0];
  let f1 = frequencies[i];
  let f0 = i === 0 ? 0 : frequencies[i-1];
  let f2 = i === frequencies.length - 1 ? 0 : frequencies[i+1];
  let L = classes[i].lower;
  let h = classes[i].upper - classes[i].lower;
  let denominator = (2*f1 - f0 - f2);
  if (denominator === 0) return "Cannot calculate mode";
  let mode = L + ((f1 - f0)/denominator) * h;
  return mode;
}
function calculate() {
  const calcType = calcTypeElem.value;
  const dataType = dataTypeElem.value;
  resultDiv.textContent = "";
  if (!calcType) {
    alert("Select calculation type");
    return;
  }
  if (!dataType) {
    alert("Select data type");
    return;
  }
  if (dataType === "simple") {
    let nums = parseSimpleData();
    if (!nums) {
      alert("Enter valid simple data");
      return;
    }
    if (calcType === "mean") {
      const mean = meanSimple(nums);
      resultDiv.textContent = `Mean: ${mean.toFixed(2)}`;
    } else if (calcType === "median") {
      const median = medianSimple(nums);
      resultDiv.textContent = `Median: ${median.toFixed(2)}`;
    } else if (calcType === "mode") {
      const mode = modeSimple(nums);
      resultDiv.textContent = `Mode: ${mode}`;
    }
  } else if (dataType === "classFreq") {
    let parsed = parseClassFreq();
    if (!parsed) {
      alert("Enter valid class intervals and frequencies");
      return;
    }
    let { classes, frequencies } = parsed;
    if (calcType === "mean") {
      const mean = meanClassFreq(classes, frequencies);
      resultDiv.textContent = `Mean: ${mean.toFixed(2)}`;
    } else if (calcType === "median") {
      let seriesType = medianSeriesElem.value;
      if (!seriesType) {
        alert("Select median series type");
        return;
      }
      const median = medianClassFreq(classes, frequencies, seriesType);
      if (median === null) {
        resultDiv.textContent = "Cannot calculate median for selected inputs";
      } else {
        resultDiv.textContent = `Median: ${median.toFixed(2)}`;
      }
    } else if (calcType === "mode") {
      const mode = modeClassFreq(classes, frequencies);
      resultDiv.textContent = `Mode: ${typeof mode === "string" ? mode : mode.toFixed(2)}`;
    }
  }
}
calcTypeElem.addEventListener("change", resetInputs);
dataTypeElem.addEventListener("change", resetInputs);

    document.getElementById('feedbackBtn').onclick = function () {
      var form = document.getElementById('feedbackForm');
      form.style.display = (form.style.display === 'none' || !form.style.display) ? 'block' : 'none';
    };
