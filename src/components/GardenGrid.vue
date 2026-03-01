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
      <div v-if="store.toolMode === 'inspect' && store.selectedCellKeys.size > 1" class="multi-select-hint">
        🔷 <strong>{{ store.selectedCellKeys.size }} cells selected</strong> — Ctrl+click to add/remove. See bulk-edit panel →
        <button class="clear-btn" @click="store.clearSelection()">✕ Clear</button>
      </div>    <div v-if="store.toolMode === 'shape'" class="shape-hint">
      ✏️ <strong>Shape Editor</strong> — Click cells to toggle them on/off. Create L-shapes, U-shapes, or any custom layout.
    </div>

    <div
      class="garden-grid"
      :style="gridStyle"
      @mousedown="startPainting"
      @mouseup="stopPainting"
      @mouseleave="stopPainting"
    >
      <!-- Column headers (spacer + numbered) -->
      <template v-if="colHeaders.length">
        <div class="grid-corner"></div>
        <div class="grid-col-header" v-for="h in colHeaders" :key="'ch-' + h">{{ h }}</div>
      </template>

      <template v-for="(cell, idx) in gridCells" :key="idx">
        <!-- Row number at start of each row -->
        <div v-if="cell.col === 0" class="grid-row-header">{{ cell.row + 1 }}</div>

        <div
          class="grid-cell"
          :class="{
            'has-plant': cell.plant !== null,
            'is-selected': cell.key === store.selectedCellKey && store.selectedCellKeys.size <= 1,
            'is-multi-selected': store.selectedCellKeys.has(cell.key),
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
          @mousedown.prevent="onCellMouseDown(cell.row, cell.col, $event)"
          @mouseenter="onCellMouseEnter(cell.row, cell.col)"
          @click="onCellClick(cell.row, cell.col, $event)"
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
      </template>
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

const colHeaders = computed(() => {
  if (!store.activeBed) return []
  return Array.from({ length: store.activeBed.cols }, (_, i) => i + 1)
})

const gridStyle = computed(() => {
  if (!store.activeBed) return {}
  // +1 col for row-number header column; +1 row for col-number header row
  return {
    gridTemplateColumns: `24px repeat(${store.activeBed.cols}, 1fr)`,
    gridTemplateRows: `20px repeat(${store.activeBed.rows}, 1fr)`,
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

function onCellMouseDown(row: number, col: number, event: MouseEvent) {
  isPainting.value = true
  // Inspect mode selection is handled entirely in the click event (which carries modifier keys).
  // Paint/erase/shape modes act on mousedown so drag-painting works.
  if (store.toolMode !== 'inspect') {
    store.handleCellClick(row, col)
  }
}

function onCellMouseEnter(row: number, col: number) {
  if (isPainting.value && store.toolMode !== 'inspect') {
    store.handleCellClick(row, col)
  }
}

function onCellClick(row: number, col: number, event: MouseEvent) {
  if (store.toolMode === 'inspect') {
    store.handleCellClick(row, col, event.ctrlKey || event.metaKey)
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

.multi-select-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f3ff;
  border: 1px solid #c4b5fd;
  color: #4c1d95;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.clear-btn {
  margin-left: auto;
  background: #ede9fe;
  border: 1px solid #c4b5fd;
  border-radius: 6px;
  color: #6d28d9;
  font-size: 0.75rem;
  padding: 2px 10px;
  cursor: pointer;
}

.clear-btn:hover {
  background: #ddd6fe;
}

.garden-grid {
  display: grid;
  gap: 1px;
  background: #94a3b8;
  border: 2px solid #64748b;
  border-radius: 4px;
  padding: 1px;
  flex: 1;
  min-height: 300px;
  user-select: none;
  cursor: crosshair;
}

.grid-corner {
  background: #e2e8f0;
}

.grid-col-header {
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: #64748b;
  min-height: 20px;
}

/* The very first header cell (top-left corner) handled by an implicit empty col */.grid-row-header {
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: #64748b;
}

.grid-cell {
  background: #f8fafc;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  min-width: 48px;
  position: relative;
  transition: background 0.1s ease, outline 0.1s ease;
  overflow: hidden;
}

.grid-cell:hover {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  z-index: 1;
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

.grid-cell.is-multi-selected {
  outline: 3px solid #7c3aed;
  outline-offset: -1px;
  z-index: 2;
  background-color: rgba(124, 58, 237, 0.08);
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
