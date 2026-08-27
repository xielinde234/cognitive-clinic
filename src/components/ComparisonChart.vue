<template>
  <div class="comparison-chart">
    <canvas ref="chartRef"></canvas>
    <div class="chart-legend">
      <span class="legend-item official">
        <span class="legend-color official"></span>
        官方数据
      </span>
      <span class="legend-item adjusted">
        <span class="legend-color adjusted"></span>
        去噪修正
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  Chart,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const chartRef = ref(null)
let chartInstance = null

function createChart() {
  if (!chartRef.value || !props.data?.labels) return

  const ctx = chartRef.value.getContext('2d')

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.data.labels,
      datasets: [
        {
          label: '官方数据',
          data: props.data.official,
          backgroundColor: 'rgba(47, 111, 237, 0.7)',
          borderColor: 'rgba(47, 111, 237, 1)',
          borderWidth: 1,
        },
        {
          label: '去噪修正',
          data: props.data.adjusted,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y}%`
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            font: { size: 11 },
          },
        },
        y: {
          ticks: {
            callback: function (value) {
              return value + '%'
            },
            font: { size: 11 },
          },
        },
      },
    },
  })
}

onMounted(() => {
  createChart()
})

watch(() => props.data, () => {
  createChart()
}, { deep: true })
</script>

<style scoped>
.comparison-chart {
  margin-top: 12px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--soft);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-color.official {
  background: rgba(47, 111, 237, 0.7);
}

.legend-color.adjusted {
  background: rgba(239, 68, 68, 0.7);
}
</style>
