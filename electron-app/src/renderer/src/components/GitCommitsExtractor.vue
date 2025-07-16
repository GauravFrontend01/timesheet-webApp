<script setup lang="ts">
import { ref } from 'vue'

const since = ref('')
const until = ref('')
const loading = ref(false)
const error = ref('')
const tableRows = ref<Array<{
  date: string
  task: string
  summary: string
  hours: number
  extra1: string
  extra2: string
}>>([])
const rawOutput = ref('')
const excludeWeekends = ref(true)

function setToday() {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}-${mm}-${dd}`
  since.value = dateStr
  until.value = dateStr
}

function setThisWeek() {
  const today = new Date()
  const dayOfWeek = today.getDay() || 7 // Sunday=0, treat as 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + 1)
  const yyyy = monday.getFullYear()
  const mm = String(monday.getMonth() + 1).padStart(2, '0')
  const dd = String(monday.getDate()).padStart(2, '0')
  since.value = `${yyyy}-${mm}-${dd}`
  // Set until to today
  const tyyyy = today.getFullYear()
  const tmm = String(today.getMonth() + 1).padStart(2, '0')
  const tdd = String(today.getDate()).padStart(2, '0')
  until.value = `${tyyyy}-${tmm}-${tdd}`
}

function setThisMonth() {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  since.value = `${yyyy}-${mm}-01`
  const tdd = String(today.getDate()).padStart(2, '0')
  until.value = `${yyyy}-${mm}-${tdd}`
}

function isWeekend(dateStr) {
  const [yyyy, mm, dd] = dateStr.split('-')
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  const day = date.getDay()
  return day === 0 || day === 6
}

const runExtraction = async () => {
  error.value = ''
  tableRows.value = []
  rawOutput.value = ''
  loading.value = true
  try {
    const result = await (window.api as any).extractGitCommits(since.value, until.value)
    let filteredRows = result.tableRows
    let filteredRaw = result.raw
    if (excludeWeekends.value) {
      filteredRows = result.tableRows.filter(row => !isWeekend(row.date))
      // Filter raw output lines by date
      filteredRaw = result.raw
        .split('\n')
        .filter(line => {
          const date = line.split(' | ')[0]
          return !isWeekend(date)
        })
        .join('\n')
    }
    tableRows.value = filteredRows
    rawOutput.value = filteredRaw || ''
  } catch (e: any) {
    error.value = e?.message || 'Failed to extract commits.'
  } finally {
    loading.value = false
  }
}

const copyTable = () => {
  if (!tableRows.value.length) return
  const header = 'Date\tTask\tSummary\tHours\t\t'
  const rows = tableRows.value.map(row =>
    `${row.date}\t${row.task}\t${row.summary}\t${row.hours}\t${row.extra1}\t${row.extra2}`
  )
  const text = [header, ...rows].join('\n')
  navigator.clipboard.writeText(text)
}
</script>

<template>
  <div class="git-commits-extractor-full">
    <h2>Extract Git Commits</h2>
    <div class="toggle-row">
      <label class="toggle-label">
        <input type="checkbox" v-model="excludeWeekends" />
        Exclude weekends
      </label>
    </div>
    <div class="quick-buttons">
      <button @click="setToday">Today</button>
      <button @click="setThisWeek">This Week</button>
      <button @click="setThisMonth">This Month</button>
    </div>
    <div class="inputs">
      <label>
        From:
        <input type="date" v-model="since" />
      </label>
      <label>
        To:
        <input type="date" v-model="until" />
      </label>
      <button @click="runExtraction" :disabled="loading || !since || !until">{{ loading ? 'Running...' : 'Run' }}</button>
    </div>
    <div v-if="error" class="error">{{ error }}</div>
    <div class="split-panels">
      <div class="panel raw-panel">
        <h3>Git Log Output</h3>
        <pre class="raw-scrollable">{{ rawOutput }}</pre>
      </div>
      <div class="panel table-panel">
        <h3>Excel Table</h3>
        <button @click="copyTable" :disabled="!tableRows.length">Copy Table</button>
        <div class="table-scrollable">
          <table v-if="tableRows.length">
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Summary</th>
                <th>Hours</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tableRows" :key="row.date + row.summary">
                <td>{{ row.date }}</td>
                <td>{{ row.task }}</td>
                <td>{{ row.summary }}</td>
                <td>{{ row.hours }}</td>
                <td>{{ row.extra1 }}</td>
                <td>{{ row.extra2 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.git-commits-extractor-full {
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  padding: 2rem 2vw 2rem 2vw;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  color: #000;
}
.toggle-row {
  margin-bottom: 0.5rem;
}
.toggle-label {
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  user-select: none;
}
.quick-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.inputs {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}
.split-panels {
  display: flex;
  flex: 1 1 auto;
  gap: 2rem;
  min-height: 0;
}
.panel {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 1rem;
  height: 100%;
}
.raw-panel {
  margin-right: 0;
}
.raw-scrollable {
  flex: 1 1 auto;
  background: #f4f4f4;
  padding: 0.5rem;
  border-radius: 4px;
  max-height: 100%;
  overflow: auto;
  color: #222;
}
.table-panel {
  margin-left: 0;
  display: flex;
  flex-direction: column;
}
.table-scrollable {
  flex: 1 1 auto;
  overflow: auto;
  margin-top: 0.5rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  color: #000;
}
th, td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
  color: #000;
}
th {
  background: #f0f0f0;
}
button {
  padding: 0.4rem 1rem;
  border-radius: 4px;
  border: 1px solid #888;
  background: #fff;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error {
  color: #b00;
  margin-bottom: 1rem;
}
@media (max-width: 900px) {
  .split-panels {
    flex-direction: column;
    gap: 1rem;
  }
  .panel {
    min-height: 200px;
    height: 50vh;
  }
}
</style> 