<template>
  <div class="score-radar">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps({
  scores: {
    type: Object,
    required: true,
  },
})

const chartRef = ref(null)
let chartInstance = null

const dimensions = [
  { key: 'logic', label: '逻辑自洽度' },
  { key: 'diversity', label: '思路多维性' },
  { key: 'causation', label: '因果定性验证' },
  { key: 'factStandard', label: '事实标准透明度' },
  { key: 'debiased', label: '利益政治去噪' },
]

function createChart() {
  if (!chartRef.value) return

  const ctx = chartRef.value.getContext('2d')
  const data = dimensions.map(d => props.scores[d.key] || 0)

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: dimensions.map(d => d.label),
      datasets: [
        {
          label: '评分',
          data,
          backgroundColor: 'rgba(14, 159, 138, 0.2)',
          borderColor: 'rgba(14, 159, 138, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(14, 159, 138, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: {
            stepSize: 1,
            font: { size: 10 },
            backdropColor: 'transparent',
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          pointLabels: {
            font: { size: 11 },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  })
}

onMounted(() => {
  createChart()
})

watch(() => props.scores, () => {
  createChart()
}, { deep: true })
</script>

<style scoped>
.score-radar {
  max-width: 300px;
  margin: 0 auto;
}
</style>
