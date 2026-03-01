<template>
  <div class="plant-detail-panel" v-if="store.selectedCell && plantType">
    <div class="detail-header" :style="{ borderColor: plantType.color }">
      <div class="detail-title-row">
        <span class="detail-emoji">{{ plantType.emoji }}</span>
        <div>
          <h3>{{ plantType.name }}</h3>
          <span class="detail-category">{{ plantType.category }}</span>
        </div>
      </div>
      <button class="close-btn" @click="store.selectedCellKey = null" title="Close">×</button>
    </div>

    <div class="detail-body">
      <!-- Quick Status -->
      <section class="detail-section">
        <h4>Status & Health</h4>
        <div class="field-row">
          <label>Status</label>
          <select :value="store.selectedCell.status" @change="update('status', ($event.target as HTMLSelectElement).value)">
            <option v-for="s in PLANT_STATUSES" :key="s.value" :value="s.value">{{ s.icon }} {{ s.label }}</option>
          </select>
        </div>
        <div class="field-row">
          <label>Health</label>
          <select :value="store.selectedCell.health" @change="update('health', ($event.target as HTMLSelectElement).value)">
            <option v-for="h in HEALTH_OPTIONS" :key="h.value" :value="h.value">{{ h.label }}</option>
          </select>
        </div>
        <div class="field-row">
          <label>Rating</label>
          <div class="star-rating">
            <button
              v-for="star in 5"
              :key="star"
              class="star-btn"
              :class="{ active: (store.selectedCell.rating ?? 0) >= star }"
              @click="update('rating', star)"
            >★</button>
          </div>
        </div>
      </section>

      <!-- Variety & Source -->
      <section class="detail-section">
        <h4>Variety & Source</h4>
        <div class="field-row">
          <label>Variety / Cultivar</label>
          <input type="text" :value="store.selectedCell.variety" @change="update('variety', ($event.target as HTMLInputElement).value)" placeholder="e.g. Brandywine, Early Girl" />
        </div>
        <div class="field-row">
          <label>Seed Source</label>
          <input type="text" :value="store.selectedCell.seedSource" @change="update('seedSource', ($event.target as HTMLInputElement).value)" placeholder="e.g. Baker Creek, saved seed" />
        </div>
      </section>

      <!-- Key Dates -->
      <section class="detail-section">
        <h4>📅 Key Dates</h4>
        <div class="field-row" v-for="dateField in dateFields" :key="dateField.key">
          <label>{{ dateField.label }}</label>
          <input
            type="date"
            :value="(store.selectedCell as any)[dateField.key]"
            @change="update(dateField.key, ($event.target as HTMLInputElement).value || null)"
          />
        </div>
      </section>

      <!-- Yield -->
      <section class="detail-section">
        <h4>🧺 Harvest & Yield</h4>
        <div class="field-row">
          <label>Total Yield</label>
          <div class="yield-row">
            <input
              type="number"
              :value="store.selectedCell.yieldTotal"
              @change="update('yieldTotal', parseFloat(($event.target as HTMLInputElement).value) || null)"
              placeholder="0"
              min="0"
              step="0.1"
            />
            <select :value="store.selectedCell.yieldUnit" @change="update('yieldUnit', ($event.target as HTMLSelectElement).value)">
              <option value="">Unit</option>
              <option value="lbs">lbs</option>
              <option value="oz">oz</option>
              <option value="count">count</option>
              <option value="bunches">bunches</option>
              <option value="cups">cups</option>
              <option value="quarts">quarts</option>
              <option value="gallons">gallons</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Care Details -->
      <section class="detail-section">
        <h4>💧 Care Details</h4>
        <div class="field-row">
          <label>Watering Method</label>
          <select :value="store.selectedCell.wateringMethod" @change="update('wateringMethod', ($event.target as HTMLSelectElement).value)">
            <option value="">Not set</option>
            <option value="drip">Drip</option>
            <option value="sprinkler">Sprinkler</option>
            <option value="hand-watering">Hand Watering</option>
            <option value="soaker-hose">Soaker Hose</option>
            <option value="none">None</option>
          </select>
        </div>
        <div class="field-row">
          <label>Watering Frequency</label>
          <input type="text" :value="store.selectedCell.wateringFrequency" @change="update('wateringFrequency', ($event.target as HTMLInputElement).value)" placeholder="e.g. Daily, every 2 days" />
        </div>
        <div class="field-row">
          <label>Fertilizer Used</label>
          <input type="text" :value="store.selectedCell.fertilizerUsed" @change="update('fertilizerUsed', ($event.target as HTMLInputElement).value)" placeholder="e.g. 10-10-10, fish emulsion" />
        </div>
        <div class="field-row">
          <label>Fertilizer Schedule</label>
          <input type="text" :value="store.selectedCell.fertilizerSchedule" @change="update('fertilizerSchedule', ($event.target as HTMLInputElement).value)" placeholder="e.g. Every 2 weeks" />
        </div>
        <div class="field-row">
          <label>Mulch Type</label>
          <input type="text" :value="store.selectedCell.mulchType" @change="update('mulchType', ($event.target as HTMLInputElement).value)" placeholder="e.g. Straw, wood chips" />
        </div>
        <div class="field-row">
          <label>Support Type</label>
          <select :value="store.selectedCell.supportType" @change="update('supportType', ($event.target as HTMLSelectElement).value)">
            <option value="">None</option>
            <option value="stake">Stake</option>
            <option value="cage">Cage</option>
            <option value="trellis">Trellis</option>
            <option value="fence">Fence</option>
            <option value="raised-bed-edge">Raised Bed Edge</option>
          </select>
        </div>
      </section>

      <!-- Issues -->
      <section class="detail-section">
        <h4>🐛 Issues & Treatments</h4>
        <div class="field-row">
          <label>Pest Issues</label>
          <textarea :value="store.selectedCell.pestIssues" @change="update('pestIssues', ($event.target as HTMLTextAreaElement).value)" placeholder="Describe any pest issues..." rows="2"></textarea>
        </div>
        <div class="field-row">
          <label>Disease Issues</label>
          <textarea :value="store.selectedCell.diseaseIssues" @change="update('diseaseIssues', ($event.target as HTMLTextAreaElement).value)" placeholder="Describe any disease issues..." rows="2"></textarea>
        </div>
        <div class="field-row">
          <label>Treatments Applied</label>
          <textarea :value="store.selectedCell.treatmentsApplied" @change="update('treatmentsApplied', ($event.target as HTMLTextAreaElement).value)" placeholder="Neem oil, diatomaceous earth, etc." rows="2"></textarea>
        </div>
      </section>

      <!-- Notes -->
      <section class="detail-section">
        <h4>📝 Notes</h4>
        <textarea
          :value="store.selectedCell.notes"
          @change="update('notes', ($event.target as HTMLTextAreaElement).value)"
          placeholder="Any additional observations, notes, or reminders..."
          rows="4"
        ></textarea>
      </section>

      <!-- Plant Type Reference -->
      <section class="detail-section reference">
        <h4>📖 Plant Reference</h4>
        <div class="ref-grid">
          <div class="ref-item"><span class="ref-label">Days to Germination</span><span>{{ plantType.daysToGermination ?? 'N/A' }}</span></div>
          <div class="ref-item"><span class="ref-label">Days to Maturity</span><span>{{ plantType.daysToMaturity ?? 'N/A' }}</span></div>
          <div class="ref-item"><span class="ref-label">Spacing</span><span>{{ plantType.spacingInches }}" apart</span></div>
          <div class="ref-item"><span class="ref-label">Row Spacing</span><span>{{ plantType.rowSpacingInches }}"</span></div>
          <div class="ref-item"><span class="ref-label">Plant Depth</span><span>{{ plantType.plantDepthInches }}"</span></div>
          <div class="ref-item"><span class="ref-label">Sun</span><span>{{ plantType.sunRequirement }}</span></div>
          <div class="ref-item"><span class="ref-label">Water</span><span>{{ plantType.waterNeeds }}</span></div>
          <div class="ref-item"><span class="ref-label">Soil</span><span>{{ plantType.soilType }}</span></div>
          <div class="ref-item"><span class="ref-label">pH Range</span><span>{{ plantType.phRange }}</span></div>
          <div class="ref-item"><span class="ref-label">Zones</span><span>{{ plantType.hardinessZones }}</span></div>
        </div>
        <div class="ref-companions" v-if="plantType.companionPlants.length">
          <span class="ref-label">Companions:</span>
          <span class="companion-tag good" v-for="c in plantType.companionPlants" :key="c">{{ c }}</span>
        </div>
        <div class="ref-companions" v-if="plantType.incompatiblePlants.length">
          <span class="ref-label">Avoid:</span>
          <span class="companion-tag bad" v-for="c in plantType.incompatiblePlants" :key="c">{{ c }}</span>
        </div>
        <p class="ref-notes" v-if="plantType.notes">💡 {{ plantType.notes }}</p>
      </section>

      <!-- Danger Zone -->
      <section class="detail-section danger">
        <button class="delete-btn" @click="removeThisPlant">🗑️ Remove Plant from Cell</button>
      </section>
    </div>
  </div>

  <!-- Bulk-edit panel: shown when 2+ cells are selected -->
  <div class="plant-detail-panel" v-else-if="store.selectedCellKeys.size > 1">
    <div class="detail-header" style="border-color: #7c3aed">
      <div class="detail-title-row">
        <span class="detail-emoji">🔷</span>
        <div>
          <h3>{{ store.selectedCellKeys.size }} Cells Selected</h3>
          <span class="detail-category">Bulk Edit Mode</span>
        </div>
      </div>
      <button class="close-btn" @click="store.clearSelection()" title="Clear selection">×</button>
    </div>

    <div class="detail-body">
      <section class="detail-section">
        <h4>Status & Health</h4>
        <p class="bulk-hint">Only non-blank fields will be applied to all {{ store.selectedCellKeys.size }} cells.</p>

        <div class="field-row">
          <label>Status</label>
          <select v-model="bulkStatus">
            <option value="">— keep existing —</option>
            <option v-for="s in PLANT_STATUSES" :key="s.value" :value="s.value">{{ s.icon }} {{ s.label }}</option>
          </select>
        </div>

        <div class="field-row">
          <label>Health</label>
          <select v-model="bulkHealth">
            <option value="">— keep existing —</option>
            <option v-for="h in HEALTH_OPTIONS" :key="h.value" :value="h.value">{{ h.label }}</option>
          </select>
        </div>

        <div class="field-row">
          <label>Rating</label>
          <select v-model="bulkRating">
            <option value="">— keep existing —</option>
            <option v-for="n in 5" :key="n" :value="n">{{ '★'.repeat(n) + '☆'.repeat(5 - n) }}</option>
          </select>
        </div>
      </section>

      <section class="detail-section">
        <h4>💧 Watering & Care</h4>
        <div class="field-row">
          <label>Watering Method</label>
          <select v-model="bulkWatering">
            <option value="">— keep existing —</option>
            <option value="drip">Drip</option>
            <option value="sprinkler">Sprinkler</option>
            <option value="hand-watering">Hand Watering</option>
            <option value="soaker-hose">Soaker Hose</option>
            <option value="none">None</option>
          </select>
        </div>

        <div class="field-row">
          <label>Watering Frequency</label>
          <input type="text" v-model="bulkWateringFrequency" placeholder="— keep existing —" />
        </div>

        <div class="field-row">
          <label>Support Type</label>
          <select v-model="bulkSupport">
            <option value="">— keep existing —</option>
            <option value="none">None</option>
            <option value="stake">Stake</option>
            <option value="cage">Cage</option>
            <option value="trellis">Trellis</option>
            <option value="fence">Fence</option>
            <option value="raised-bed-edge">Raised Bed Edge</option>
          </select>
        </div>

        <div class="field-row">
          <label>Mulch Type</label>
          <input type="text" v-model="bulkMulch" placeholder="— keep existing —" />
        </div>
      </section>

      <section class="detail-section">
        <h4>🌱 Fertilizer</h4>
        <div class="field-row">
          <label>Fertilizer Used</label>
          <input type="text" v-model="bulkFertilizer" placeholder="— keep existing —" />
        </div>
        <div class="field-row">
          <label>Fertilizer Schedule</label>
          <input type="text" v-model="bulkFertilizerSchedule" placeholder="— keep existing —" />
        </div>
      </section>

      <section class="detail-section">
        <h4>🐛 Issues & Treatments</h4>
        <div class="field-row">
          <label>Pest Issues</label>
          <input type="text" v-model="bulkPestIssues" placeholder="— keep existing —" />
        </div>
        <div class="field-row">
          <label>Disease Issues</label>
          <input type="text" v-model="bulkDiseaseIssues" placeholder="— keep existing —" />
        </div>
        <div class="field-row">
          <label>Treatments Applied</label>
          <input type="text" v-model="bulkTreatments" placeholder="— keep existing —" />
        </div>
      </section>

      <section class="detail-section">
        <h4>🏷️ Identity</h4>
        <div class="field-row">
          <label>Variety</label>
          <input type="text" v-model="bulkVariety" placeholder="— keep existing —" />
        </div>
        <div class="field-row">
          <label>Seed Source</label>
          <input type="text" v-model="bulkSeedSource" placeholder="— keep existing —" />
        </div>
      </section>

      <section class="detail-section">
        <h4>📅 Bulk Set Date</h4>
        <div class="field-row">
          <label>Date Field</label>
          <select v-model="bulkDateField">
            <option value="">Select...</option>
            <option value="datePlanned">Date Planned</option>
            <option value="dateSeededIndoors">Seeded Indoors</option>
            <option value="dateTransplanted">Transplanted</option>
            <option value="dateDirectSown">Direct Sown</option>
            <option value="dateFirstSprout">First Sprout</option>
            <option value="dateFirstHarvest">First Harvest</option>
            <option value="dateLastHarvest">Last Harvest</option>
            <option value="dateRemoved">Removed</option>
          </select>
        </div>
        <div class="field-row" v-if="bulkDateField">
          <label>Date Value</label>
          <input type="date" v-model="bulkDateValue" />
        </div>
      </section>

      <section class="detail-section">
        <h4>📝 Append to Notes</h4>
        <p class="bulk-hint">This text will be appended to each cell's existing notes.</p>
        <textarea v-model="bulkNotesAppend" rows="3" placeholder="Enter text to append..."></textarea>
      </section>

      <section class="detail-section">
        <button class="bulk-apply-btn" @click="applyBulk">
          ✅ Apply to {{ store.selectedCellKeys.size }} cells
        </button>
        <button class="bulk-clear-btn" @click="store.clearSelection()">
          Clear Selection
        </button>
      </section>
    </div>
  </div>

  <div class="plant-detail-panel empty" v-else-if="!store.selectedCell">
    <div class="empty-detail">
      <span>🔍</span>
      <p>Select a planted cell in <strong>Inspect</strong> mode to view and edit details</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGardenStore } from '../stores/gardenStore'
import { PLANT_STATUSES, HEALTH_OPTIONS } from '../data/types'

const store = useGardenStore()

// --- Bulk edit state ---
const bulkStatus = ref('')
const bulkHealth = ref('')
const bulkRating = ref('')
const bulkWatering = ref('')
const bulkWateringFrequency = ref('')
const bulkSupport = ref('')
const bulkMulch = ref('')
const bulkFertilizer = ref('')
const bulkFertilizerSchedule = ref('')
const bulkPestIssues = ref('')
const bulkDiseaseIssues = ref('')
const bulkTreatments = ref('')
const bulkVariety = ref('')
const bulkSeedSource = ref('')
const bulkDateField = ref('')
const bulkDateValue = ref('')
const bulkNotesAppend = ref('')

function applyBulk() {
  const updates: Record<string, any> = {}
  if (bulkStatus.value) updates.status = bulkStatus.value
  if (bulkHealth.value) updates.health = bulkHealth.value
  if (bulkRating.value) updates.rating = parseInt(bulkRating.value)
  if (bulkWatering.value) updates.wateringMethod = bulkWatering.value
  if (bulkWateringFrequency.value) updates.wateringFrequency = bulkWateringFrequency.value
  if (bulkSupport.value) updates.supportType = bulkSupport.value
  if (bulkMulch.value) updates.mulchType = bulkMulch.value
  if (bulkFertilizer.value) updates.fertilizerUsed = bulkFertilizer.value
  if (bulkFertilizerSchedule.value) updates.fertilizerSchedule = bulkFertilizerSchedule.value
  if (bulkPestIssues.value) updates.pestIssues = bulkPestIssues.value
  if (bulkDiseaseIssues.value) updates.diseaseIssues = bulkDiseaseIssues.value
  if (bulkTreatments.value) updates.treatmentsApplied = bulkTreatments.value
  if (bulkVariety.value) updates.variety = bulkVariety.value
  if (bulkSeedSource.value) updates.seedSource = bulkSeedSource.value
  if (bulkDateField.value && bulkDateValue.value) updates[bulkDateField.value] = bulkDateValue.value

  if (Object.keys(updates).length) {
    store.bulkUpdateSelected(updates)
  }

  if (bulkNotesAppend.value) {
    for (const key of store.selectedCellKeys) {
      const cell = store.activeBed?.cells[key]
      if (cell) {
        store.updatePlantInstance(key, {
          notes: (cell.notes ? cell.notes + '\n' : '') + bulkNotesAppend.value,
        })
      }
    }
  }

  // Reset fields after applying
  bulkStatus.value = ''
  bulkHealth.value = ''
  bulkRating.value = ''
  bulkWatering.value = ''
  bulkWateringFrequency.value = ''
  bulkSupport.value = ''
  bulkMulch.value = ''
  bulkFertilizer.value = ''
  bulkFertilizerSchedule.value = ''
  bulkPestIssues.value = ''
  bulkDiseaseIssues.value = ''
  bulkTreatments.value = ''
  bulkVariety.value = ''
  bulkSeedSource.value = ''
  bulkDateField.value = ''
  bulkDateValue.value = ''
  bulkNotesAppend.value = ''
}

const plantType = computed(() => {
  if (!store.selectedCell) return null
  return store.plantTypes.find((p) => p.id === store.selectedCell!.plantTypeId) ?? null
})

const dateFields = [
  { key: 'datePlanned', label: 'Date Planned' },
  { key: 'dateSeededIndoors', label: 'Seeded Indoors' },
  { key: 'dateDirectSown', label: 'Direct Sown' },
  { key: 'dateTransplanted', label: 'Transplanted' },
  { key: 'dateFirstSprout', label: 'First Sprout' },
  { key: 'dateFirstTrueLeaves', label: 'First True Leaves' },
  { key: 'dateFirstFlower', label: 'First Flower' },
  { key: 'dateFirstFruit', label: 'First Fruit' },
  { key: 'dateFirstHarvest', label: 'First Harvest' },
  { key: 'dateLastHarvest', label: 'Last Harvest' },
  { key: 'dateRemoved', label: 'Date Removed' },
]

function update(field: string, value: any) {
  if (!store.selectedCellKey) return
  store.updatePlantInstance(store.selectedCellKey, { [field]: value })
}

function removeThisPlant() {
  if (!store.selectedCell || !store.selectedCellKey) return
  const key = store.selectedCellKey
  const [r, c] = key.split('-').map(Number)
  store.eraseCell(r, c)
}
</script>

<style scoped>
.plant-detail-panel {
  width: 360px;
  background: white;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
}

.bulk-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 10px;
}

.bulk-apply-btn {
  width: 100%;
  padding: 10px;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.bulk-apply-btn:hover { background: #6d28d9; }

.bulk-clear-btn {
  width: 100%;
  padding: 8px;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
}

.bulk-clear-btn:hover { background: #e5e7eb; }

.plant-detail-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-detail {
  text-align: center;
  color: #9ca3af;
  padding: 20px;
}

.empty-detail span {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 3px solid;
  background: #fafafa;
  position: sticky;
  top: 0;
  z-index: 1;
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-emoji {
  font-size: 2rem;
}

.detail-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #1a1a2e;
}

.detail-category {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.05em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.detail-body {
  padding: 0;
  flex: 1;
}

.detail-section {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.detail-section h4 {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-row {
  margin-bottom: 10px;
}

.field-row label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 4px;
  font-weight: 500;
}

.field-row input,
.field-row select,
.field-row textarea {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
  background: white;
  box-sizing: border-box;
}

.field-row input:focus,
.field-row select:focus,
.field-row textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.field-row textarea {
  resize: vertical;
}

.yield-row {
  display: flex;
  gap: 8px;
}

.yield-row input {
  flex: 1;
}

.yield-row select {
  width: 100px;
}

.star-rating {
  display: flex;
  gap: 2px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #d1d5db;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.star-btn.active {
  color: #f59e0b;
}

.star-btn:hover {
  color: #fbbf24;
}

.reference {
  background: #f9fafb;
}

.ref-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.ref-item {
  display: flex;
  flex-direction: column;
}

.ref-label {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 500;
}

.ref-item span:last-child {
  font-size: 0.85rem;
  color: #1f2937;
  font-weight: 500;
}

.ref-companions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
}

.companion-tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.companion-tag.good {
  background: #dcfce7;
  color: #166534;
}

.companion-tag.bad {
  background: #fef2f2;
  color: #991b1b;
}

.ref-notes {
  margin: 10px 0 0;
  font-size: 0.8rem;
  color: #4b5563;
  line-height: 1.4;
  background: white;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.danger {
  border-bottom: none;
}

.delete-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #fca5a5;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}

.delete-btn:hover {
  background: #fee2e2;
}
</style>
