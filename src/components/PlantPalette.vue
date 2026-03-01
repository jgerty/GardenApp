<template>
  <aside class="plant-palette">
    <div class="palette-header">
      <h3>🌱 Spring Garden Planner</h3>
    </div>

    <!-- Tool Mode Selector -->
    <div class="tool-section">
      <div class="tool-buttons">
        <button
          v-for="tool in tools"
          :key="tool.mode"
          class="tool-btn"
          :class="{ active: store.toolMode === tool.mode }"
          @click="store.toolMode = tool.mode"
          :title="tool.label"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-label">{{ tool.label }}</span>
        </button>
      </div>
    </div>

    <!-- Garden Bed Selector -->
    <div class="section">
      <div class="section-header">
        <h4>Garden Beds</h4>
        <button class="icon-btn" @click="showNewBedForm = !showNewBedForm" :title="showNewBedForm ? 'Cancel' : 'New Bed'">
          {{ showNewBedForm ? '×' : '+' }}
        </button>
      </div>

      <!-- New Bed Form -->
      <div class="new-bed-form" v-if="showNewBedForm">
        <input v-model="newBed.name" placeholder="Bed name" />
        <div class="form-row">
          <div class="form-field">
            <label>Cols</label>
            <input type="number" v-model.number="newBed.cols" min="1" max="50" />
          </div>
          <div class="form-field">
            <label>Rows</label>
            <input type="number" v-model.number="newBed.rows" min="1" max="50" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Cell Size (in)</label>
            <input type="number" v-model.number="newBed.cellSizeInches" min="1" max="48" />
          </div>
          <div class="form-field">
            <label>Bed Type</label>
            <select v-model="newBed.bedType">
              <option value="raised">Raised</option>
              <option value="in-ground">In-Ground</option>
              <option value="container">Container</option>
              <option value="hydroponic">Hydroponic</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Season</label>
            <select v-model="newBed.season">
              <option>Spring</option>
              <option>Summer</option>
              <option>Fall</option>
              <option>Winter</option>
            </select>
          </div>
          <div class="form-field">
            <label>Year</label>
            <input type="number" v-model.number="newBed.year" min="2020" max="2099" />
          </div>
        </div>
        <input v-model="newBed.irrigationType" placeholder="Irrigation type (optional)" />
        <textarea v-model="newBed.soilAmendments" placeholder="Soil amendments (optional)" rows="2"></textarea>
        <textarea v-model="newBed.notes" placeholder="Notes (optional)" rows="2"></textarea>
        <button class="create-btn" @click="createNewBed">Create Bed</button>
      </div>

      <!-- Bed List -->
      <div class="bed-list">
        <div
          v-for="bed in store.gardenBeds"
          :key="bed.id"
          class="bed-item"
          :class="{ active: store.activeBedId === bed.id }"
          @click="store.setActiveBed(bed.id)"
        >
          <div class="bed-info">
            <span class="bed-name">{{ bed.name }}</span>
            <span class="bed-meta">{{ bed.cols }}×{{ bed.rows }} · {{ bed.season }} {{ bed.year }}</span>
          </div>
          <button class="delete-bed-btn" @click.stop="confirmDeleteBed(bed.id, bed.name)" title="Delete bed">🗑</button>
        </div>
        <div class="empty-beds" v-if="store.gardenBeds.length === 0">
          <p>No beds yet. Create one above!</p>
        </div>
      </div>
    </div>

    <!-- Plant Palette -->
    <div class="section" v-if="store.toolMode === 'paint'">
      <div class="section-header">
        <h4>Plant Palette</h4>
        <button class="icon-btn" @click="showCustomPlantForm = !showCustomPlantForm" :title="showCustomPlantForm ? 'Cancel' : 'Add Custom Plant'">
          {{ showCustomPlantForm ? '×' : '+' }}
        </button>
      </div>

      <!-- Custom Plant Form -->
      <div class="new-bed-form" v-if="showCustomPlantForm">
        <div class="form-section-title">🌱 New Custom Plant</div>
        <input v-model="customPlant.name" placeholder="Plant name *" />
        <div class="form-row">
          <div class="form-field">
            <label>Category</label>
            <select v-model="customPlant.category">
              <option value="vegetable">Vegetable</option>
              <option value="herb">Herb</option>
              <option value="fruit">Fruit</option>
              <option value="flower">Flower</option>
              <option value="legume">Legume</option>
              <option value="root">Root</option>
              <option value="leafy-green">Leafy Green</option>
            </select>
          </div>
          <div class="form-field">
            <label>Emoji</label>
            <input v-model="customPlant.emoji" placeholder="🌱" maxlength="4" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Color</label>
            <input type="color" v-model="customPlant.color" />
          </div>
          <div class="form-field">
            <label>Sun Needs</label>
            <select v-model="customPlant.sunRequirement">
              <option value="full-sun">Full Sun</option>
              <option value="partial-sun">Partial Sun</option>
              <option value="partial-shade">Partial Shade</option>
              <option value="full-shade">Full Shade</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Days to Germinate</label>
            <input type="number" v-model.number="customPlant.daysToGermination" min="0" placeholder="7" />
          </div>
          <div class="form-field">
            <label>Days to Maturity</label>
            <input type="number" v-model.number="customPlant.daysToMaturity" min="0" placeholder="60" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Spacing (in)</label>
            <input type="number" v-model.number="customPlant.spacingInches" min="1" placeholder="12" />
          </div>
          <div class="form-field">
            <label>Row Spacing (in)</label>
            <input type="number" v-model.number="customPlant.rowSpacingInches" min="1" placeholder="24" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Plant Depth (in)</label>
            <input type="number" v-model.number="customPlant.plantDepthInches" min="0" step="0.125" placeholder="0.25" />
          </div>
          <div class="form-field">
            <label>Water Needs</label>
            <select v-model="customPlant.waterNeeds">
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <input v-model="customPlant.soilType" placeholder="Soil type (e.g. Well-drained loam)" />
        <div class="form-row">
          <div class="form-field">
            <label>pH Range</label>
            <input v-model="customPlant.phRange" placeholder="6.0–7.0" />
          </div>
          <div class="form-field">
            <label>Hardiness Zones</label>
            <input v-model="customPlant.hardinessZones" placeholder="3–10" />
          </div>
        </div>
        <input v-model="companionInput" placeholder="Companion plants (comma-separated)" />
        <input v-model="incompatibleInput" placeholder="Incompatible plants (comma-separated)" />
        <textarea v-model="customPlant.notes" placeholder="Growing notes, tips..." rows="2"></textarea>
        <button class="create-btn" @click="addCustomPlant">Add Plant</button>
      </div>

      <input
        v-if="!showCustomPlantForm"
        type="text"
        class="search-input"
        v-model="searchQuery"
        placeholder="Search plants..."
      />

      <div class="category-filter">
        <button
          v-for="cat in categories"
          :key="cat.value"
          class="cat-btn"
          :class="{ active: selectedCategory === cat.value }"
          @click="selectedCategory = selectedCategory === cat.value ? '' : cat.value"
        >
          {{ cat.label }}
        </button>
      </div>

      <div class="plant-list">
        <div
          v-for="plant in filteredPlants"
          :key="plant.id"
          class="plant-item"
          :class="{ selected: store.selectedPlantTypeId === plant.id }"
          @click="store.selectedPlantTypeId = plant.id"
        >
          <div class="plant-color" :style="{ background: plant.color }">
            <span>{{ plant.emoji }}</span>
          </div>
          <div class="plant-info">
            <span class="plant-name">{{ plant.name }}</span>
            <span class="plant-meta">{{ plant.daysToMaturity ? plant.daysToMaturity + ' days' : '' }} · {{ plant.sunRequirement }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="section stats-section" v-if="store.activeBed && store.bedStats">
      <div class="section-header">
        <h4>Bed Summary</h4>
      </div>
      <div class="stats-grid">
        <div class="stat-item" v-for="(count, typeId) in store.bedStats.byType" :key="typeId as string">
          <span class="stat-emoji">{{ getPlantEmoji(typeId as string) }}</span>
          <span class="stat-name">{{ getPlantName(typeId as string) }}</span>
          <span class="stat-count">{{ count }}</span>
        </div>
      </div>
    </div>

    <!-- Data Management -->
    <div class="section data-section">
      <div class="section-header">
        <h4>Data</h4>
      </div>
      <div class="data-buttons">
        <button class="data-btn" @click="exportData">📤 Export</button>
        <button class="data-btn" @click="triggerImport">📥 Import</button>
      </div>
      <input type="file" ref="fileInput" accept=".json" @change="importData" style="display: none" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGardenStore } from '../stores/gardenStore'

const store = useGardenStore()

const tools = [
  { mode: 'paint' as const, icon: '🎨', label: 'Paint' },
  { mode: 'erase' as const, icon: '🧹', label: 'Erase' },
  { mode: 'inspect' as const, icon: '🔍', label: 'Inspect' },
  { mode: 'shape' as const, icon: '✏️', label: 'Shape' },
]

const categories = [
  { value: 'vegetable', label: '🥕 Veg' },
  { value: 'herb', label: '🌿 Herb' },
  { value: 'fruit', label: '🍓 Fruit' },
  { value: 'flower', label: '🌸 Flower' },
  { value: 'legume', label: '🫘 Legume' },
  { value: 'root', label: '🥔 Root' },
  { value: 'leafy-green', label: '🥬 Leafy' },
]

// Search & filter
const searchQuery = ref('')
const selectedCategory = ref('')

const filteredPlants = computed(() => {
  let plants = store.plantTypes
  if (selectedCategory.value) {
    plants = plants.filter((p) => p.category === selectedCategory.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    plants = plants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }
  return plants
})

// New bed form
const showNewBedForm = ref(false)
const newBed = ref({
  name: '',
  rows: 8,
  cols: 10,
  cellSizeInches: 12,
  bedType: 'raised' as const,
  season: 'Spring',
  year: new Date().getFullYear(),
  irrigationType: '',
  soilAmendments: '',
  notes: '',
})

// Custom plant form
const showCustomPlantForm = ref(false)
const companionInput = ref('')
const incompatibleInput = ref('')
const customPlant = ref({
  name: '',
  category: 'vegetable' as 'vegetable' | 'herb' | 'fruit' | 'flower' | 'legume' | 'root' | 'leafy-green',
  emoji: '🌱',
  color: '#22c55e',
  daysToGermination: null as number | null,
  daysToMaturity: null as number | null,
  spacingInches: 12,
  rowSpacingInches: 24,
  plantDepthInches: 0.25,
  sunRequirement: 'full-sun' as 'full-sun' | 'partial-sun' | 'partial-shade' | 'full-shade',
  waterNeeds: 'moderate' as 'low' | 'moderate' | 'high',
  soilType: '',
  phRange: '',
  companionPlants: [] as string[],
  incompatiblePlants: [] as string[],
  hardinessZones: '',
  notes: '',
})

function addCustomPlant() {
  if (!customPlant.value.name.trim()) return
  const plant = {
    ...customPlant.value,
    companionPlants: companionInput.value ? companionInput.value.split(',').map((s) => s.trim()).filter(Boolean) : [],
    incompatiblePlants: incompatibleInput.value ? incompatibleInput.value.split(',').map((s) => s.trim()).filter(Boolean) : [],
  }
  store.addCustomPlantType(plant)
  showCustomPlantForm.value = false
  // Reset
  customPlant.value = {
    name: '',
    category: 'vegetable',
    emoji: '🌱',
    color: '#22c55e',
    daysToGermination: null,
    daysToMaturity: null,
    spacingInches: 12,
    rowSpacingInches: 24,
    plantDepthInches: 0.25,
    sunRequirement: 'full-sun',
    waterNeeds: 'moderate',
    soilType: '',
    phRange: '',
    companionPlants: [],
    incompatiblePlants: [],
    hardinessZones: '',
    notes: '',
  }
  companionInput.value = ''
  incompatibleInput.value = ''
}

function createNewBed() {
  if (!newBed.value.name.trim()) return
  store.createBed(newBed.value)
  showNewBedForm.value = false
  newBed.value = {
    name: '',
    rows: 8,
    cols: 10,
    cellSizeInches: 12,
    bedType: 'raised',
    season: 'Spring',
    year: new Date().getFullYear(),
    irrigationType: '',
    soilAmendments: '',
    notes: '',
  }
}

function confirmDeleteBed(bedId: string, name: string) {
  if (confirm(`Delete "${name}"? This cannot be undone.`)) {
    store.deleteBed(bedId)
  }
}

function getPlantEmoji(typeId: string): string {
  return store.plantTypes.find((p) => p.id === typeId)?.emoji ?? '🌱'
}

function getPlantName(typeId: string): string {
  return store.plantTypes.find((p) => p.id === typeId)?.name ?? 'Unknown'
}

// Export/Import
function exportData() {
  const json = store.exportData()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `garden-data-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const fileInput = ref<HTMLInputElement>()

function triggerImport() {
  fileInput.value?.click()
}

function importData(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const success = store.importData(reader.result as string)
    if (success) {
      alert('Data imported successfully!')
    } else {
      alert('Failed to import data. Invalid format.')
    }
  }
  reader.readAsText(file)
}
</script>

<style scoped>
.plant-palette {
  width: 280px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
}

.palette-header {
  padding: 16px;
  background: linear-gradient(135deg, #166534, #15803d);
  color: white;
}

.palette-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.tool-section {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.tool-buttons {
  display: flex;
  gap: 4px;
  background: #e2e8f0;
  border-radius: 8px;
  padding: 3px;
}

.tool-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 2px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.65rem;
  color: #64748b;
  transition: all 0.15s;
  white-space: nowrap;
  min-width: 0;
}

.tool-btn.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.tool-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.section {
  border-bottom: 1px solid #e2e8f0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
}

.section-header h4 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 600;
}

.icon-btn {
  background: none;
  border: 1px solid #cbd5e1;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.icon-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

/* New Bed Form */
.new-bed-form {
  padding: 0 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.new-bed-form input,
.new-bed-form select,
.new-bed-form textarea {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  font-family: inherit;
  background: white;
  box-sizing: border-box;
}

.new-bed-form textarea {
  resize: vertical;
}

.form-row {
  display: flex;
  gap: 8px;
}

.form-field {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-field label {
  font-size: 0.7rem;
  color: #64748b;
  margin-bottom: 2px;
}

.create-btn {
  padding: 8px;
  background: #166534;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}

.create-btn:hover {
  background: #15803d;
}

.form-section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

/* Bed List */
.bed-list {
  padding: 0 8px 8px;
}

.bed-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.bed-item:hover {
  background: #e2e8f0;
}

.bed-item.active {
  background: #dcfce7;
  border: 1px solid #86efac;
}

.bed-info {
  display: flex;
  flex-direction: column;
}

.bed-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
}

.bed-meta {
  font-size: 0.7rem;
  color: #64748b;
}

.delete-bed-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.15s;
  padding: 2px 6px;
  border-radius: 4px;
}

.bed-item:hover .delete-bed-btn {
  opacity: 0.5;
}

.delete-bed-btn:hover {
  opacity: 1 !important;
  background: #fee2e2;
}

.empty-beds {
  text-align: center;
  padding: 12px;
  color: #94a3b8;
  font-size: 0.8rem;
}

/* Search */
.search-input {
  margin: 0 16px 8px;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  width: calc(100% - 32px);
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Category Filter */
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 16px 8px;
}

.cat-btn {
  font-size: 0.65rem;
  padding: 3px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  color: #64748b;
  transition: all 0.15s;
}

.cat-btn.active {
  background: #166534;
  color: white;
  border-color: #166534;
}

.cat-btn:hover {
  border-color: #166534;
}

/* Plant List */
.plant-list {
  padding: 0 8px 8px;
  max-height: 300px;
  overflow-y: auto;
}

.plant-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.plant-item:hover {
  background: #e2e8f0;
}

.plant-item.selected {
  background: #dbeafe;
  outline: 2px solid #3b82f6;
}

.plant-color {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.plant-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.plant-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
}

.plant-meta {
  font-size: 0.65rem;
  color: #94a3b8;
}

/* Stats */
.stats-section {
  padding-bottom: 8px;
}

.stats-grid {
  padding: 0 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
}

.stat-emoji {
  font-size: 0.9rem;
}

.stat-name {
  flex: 1;
  color: #475569;
}

.stat-count {
  font-weight: 700;
  color: #1e293b;
  background: #e2e8f0;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
}

/* Data section */
.data-section {
  border-bottom: none;
}

.data-buttons {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
}

.data-btn {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  color: #475569;
  transition: all 0.15s;
}

.data-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}
</style>
