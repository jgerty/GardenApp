<template>
  <div class="garden-grid-wrapper" v-if="store.activeBed">
    <div class="grid-header">
      <div class="grid-header-left">
        <h2>{{ store.activeBed.name }}</h2>
        <span class="grid-dims">{{ store.activeBed.cols }} × {{ store.activeBed.rows }} cells</span>
        <span class="grid-season">{{ store.activeBed.season }} {{ store.activeBed.year }}</span>
      </div>
      <div class="save-indicator" v-if="store.lastSavedAt">
        <span class="save-dot"></span>
        Auto-saved {{ store.lastSavedAt }}
      </div>
    </div>

    <div v-if="store.toolMode === 'shape'" class="shape-hint">
      ✏️ <strong>Shape Editor</strong> — Click cells to toggle them on/off. Create L-shapes, U-shapes, or any custom layout.
    </div>

    <div
      class="garden-grid"
      :style="gridStyle"
      @mousedown="startPainting"
      @mouseup="stopPainting"
      @mouseleave="stopPainting"
    >
      <div
        v-for="(cell, idx) in gridCells"
        :key="idx"
        class="grid-cell"
        :class="{
          'has-plant': cell.plant !== null,
          'is-selected': cell.key === store.selectedCellKey,
          'is-disabled': cell.disabled,
          'shape-mode': store.toolMode === 'shape',
          'health-excellent': cell.plant?.health === 'excellent',
          'health-good': cell.plant?.health === 'good',
          'health-fair': cell.plant?.health === 'fair',
          'health-stressed': cell.plant?.health === 'stressed',
          'health-diseased': cell.plant?.health === 'diseased',
          'health-pest': cell.plant?.health === 'pest-damage',
          'health-dead': cell.plant?.health === 'dead',
        }"
        :style="cell.plant && !cell.disabled ? { backgroundColor: getPlantColor(cell.plant.plantTypeId) } : {}"
        @mousedown.prevent="onCellMouseDown(cell.row, cell.col)"
        @mouseenter="onCellMouseEnter(cell.row, cell.col)"
        @click="onCellClick(cell.row, cell.col)"
        :title="getCellTooltip(cell)"
      >
        <template v-if="cell.disabled">
          <span class="cell-disabled-icon">✕</span>
        </template>
        <template v-else-if="cell.plant">
          <span class="cell-emoji">{{ getPlantEmoji(cell.plant.plantTypeId) }}</span>
          <div class="cell-label">{{ getPlantName(cell.plant.plantTypeId) }}</div>
        </template>
        <template v-else>
          <div class="cell-coords">{{ cell.row + 1 }},{{ cell.col + 1 }}</div>
        </template>
      </div>
    </div>

    <div class="grid-legend" v-if="store.bedStats">
      <div class="legend-stat">
        <strong>{{ store.bedStats.planted }}</strong> planted
      </div>
      <div class="legend-stat">
        <strong>{{ store.bedStats.empty }}</strong> empty
      </div>
      <div class="legend-stat">
        <strong>{{ Object.keys(store.bedStats.byType).length }}</strong> varieties
      </div>
    </div>
  </div>

  <div class="no-bed" v-else>
    <div class="no-bed-content">
      <span class="no-bed-icon">🌱</span>
      <h2>No Garden Bed Selected</h2>
      <p>Create a new garden bed to get started!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGardenStore } from '../stores/gardenStore'
import type { PlantInstance } from '../data/types'

const store = useGardenStore()
const isPainting = ref(false)

interface GridCellData {
  row: number
  col: number
  key: string
  plant: PlantInstance | null
  disabled: boolean
}

const gridCells = computed<GridCellData[]>(() => {
  if (!store.activeBed) return []
  const cells: GridCellData[] = []
  const disabledSet = new Set(store.activeBed.disabledCells ?? [])
  for (let r = 0; r < store.activeBed.rows; r++) {
    for (let c = 0; c < store.activeBed.cols; c++) {
      const key = `${r}-${c}`
      cells.push({
        row: r,
        col: c,
        key,
        plant: disabledSet.has(key) ? null : (store.activeBed.cells[key] ?? null),
        disabled: disabledSet.has(key),
      })
    }
  }
  return cells
})

const gridStyle = computed(() => {
  if (!store.activeBed) return {}
  return {
    gridTemplateColumns: `repeat(${store.activeBed.cols}, 1fr)`,
    gridTemplateRows: `repeat(${store.activeBed.rows}, 1fr)`,
  }
})

function getPlantColor(typeId: string): string {
  return store.plantTypes.find((p) => p.id === typeId)?.color ?? '#9ca3af'
}

function getPlantEmoji(typeId: string): string {
  return store.plantTypes.find((p) => p.id === typeId)?.emoji ?? '🌱'
}

function getPlantName(typeId: string): string {
  return store.plantTypes.find((p) => p.id === typeId)?.name ?? 'Unknown'
}

function getCellTooltip(cell: GridCellData): string {
  if (cell.disabled) return `Excluded cell (${cell.row + 1}, ${cell.col + 1}) — click in Shape mode to re-enable`
  if (!cell.plant) return `Empty cell (${cell.row + 1}, ${cell.col + 1})`
  const name = getPlantName(cell.plant.plantTypeId)
  return `${name} — ${cell.plant.status} — ${cell.plant.health}\n${cell.plant.variety ? 'Variety: ' + cell.plant.variety : ''}`
}

function startPainting() {
  isPainting.value = true
}

function stopPainting() {
  isPainting.value = false
}

function onCellMouseDown(row: number, col: number) {
  isPainting.value = true
  store.handleCellClick(row, col)
}

function onCellMouseEnter(row: number, col: number) {
  if (isPainting.value && store.toolMode !== 'inspect') {
    store.handleCellClick(row, col)
  }
}

function onCellClick(row: number, col: number) {
  if (store.toolMode === 'inspect') {
    const key = `${row}-${col}`
    store.selectedCellKey = store.activeBed?.cells[key] ? key : null
  }
}
</script>

<style scoped>
.garden-grid-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  min-width: 0;
}

.grid-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.grid-header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

.grid-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1a1a2e;
}

.grid-dims,
.grid-season {
  font-size: 0.875rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 10px;
  border-radius: 12px;
}

.save-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #22c55e;
  background: #f0fdf4;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid #bbf7d0;
}

.save-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse-save 2s infinite;
}

@keyframes pulse-save {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.shape-hint {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-bottom: 12px;
}

.garden-grid {
  display: grid;
  gap: 2px;
  background: #d1d5db;
  border: 2px solid #9ca3af;
  border-radius: 8px;
  padding: 2px;
  flex: 1;
  min-height: 300px;
  user-select: none;
  cursor: crosshair;
}

.grid-cell {
  background: #f9fafb;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  min-width: 48px;
  position: relative;
  transition: all 0.15s ease;
  overflow: hidden;
}

.grid-cell:hover {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  z-index: 1;
  transform: scale(1.05);
}

.grid-cell.has-plant {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.grid-cell.is-selected {
  outline: 3px solid #2563eb;
  outline-offset: -1px;
  z-index: 2;
  box-shadow: 0 0 0 2px white, 0 0 12px rgba(37, 99, 235, 0.5);
}

.cell-emoji {
  font-size: 1.25rem;
  line-height: 1;
}

.cell-label {
  font-size: 0.6rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 2px;
}

.cell-coords {
  font-size: 0.6rem;
  color: #d1d5db;
}

/* Disabled / excluded cells for custom bed shapes */
.grid-cell.is-disabled {
  background: #1e293b !important;
  cursor: pointer;
  opacity: 0.3;
}

.grid-cell.is-disabled:hover {
  opacity: 0.5;
}

.cell-disabled-icon {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: bold;
}

/* Shape editor mode visual cues */
.grid-cell.shape-mode {
  cursor: pointer;
}

.grid-cell.shape-mode:not(.is-disabled) {
  outline: 1px dashed #3b82f6;
  outline-offset: -1px;
}

/* Health indicator borders */
.grid-cell.health-excellent { box-shadow: inset 0 -3px 0 #15803d; }
.grid-cell.health-good { box-shadow: inset 0 -3px 0 #65a30d; }
.grid-cell.health-fair { box-shadow: inset 0 -3px 0 #ca8a04; }
.grid-cell.health-stressed { box-shadow: inset 0 -3px 0 #ea580c; }
.grid-cell.health-diseased { box-shadow: inset 0 -3px 0 #dc2626; }
.grid-cell.health-pest { box-shadow: inset 0 -3px 0 #9333ea; }
.grid-cell.health-dead { box-shadow: inset 0 -3px 0 #4b5563; }

.grid-legend {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  padding: 8px 16px;
  background: #f3f4f6;
  border-radius: 8px;
}

.legend-stat {
  font-size: 0.875rem;
  color: #6b7280;
}

.legend-stat strong {
  color: #1f2937;
}

.no-bed {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-bed-content {
  text-align: center;
  color: #9ca3af;
}

.no-bed-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
}

.no-bed-content h2 {
  color: #6b7280;
  margin: 0 0 8px;
}

.no-bed-content p {
  margin: 0;
}
</style>
