import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { PlantType, PlantInstance, GardenBed, GardenLog } from '../data/types'
import { defaultPlants } from '../data/plantDatabase'

const STORAGE_KEY = 'garden-planner-data'

interface SavedState {
  plantTypes: PlantType[]
  gardenBeds: GardenBed[]
  gardenLogs: GardenLog[]
  activeBedId: string | null
}

function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveState(state: SavedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const useGardenStore = defineStore('garden', () => {
  const saved = loadState()

  // --- Plant Types ---
  const plantTypes = ref<PlantType[]>(saved?.plantTypes ?? [...defaultPlants])

  // --- Garden Beds ---
  const gardenBeds = ref<GardenBed[]>(saved?.gardenBeds ?? [])

  // --- Garden Logs ---
  const gardenLogs = ref<GardenLog[]>(saved?.gardenLogs ?? [])

  // --- Active Bed ---
  const activeBedId = ref<string | null>(saved?.activeBedId ?? null)

  // --- Selected Plant Type (for painting) ---
  const selectedPlantTypeId = ref<string | null>(null)

  // --- Selected Cell (for detail view) ---
  const selectedCellKey = ref<string | null>(null)

  // --- Tool Mode ---
  const toolMode = ref<'paint' | 'erase' | 'inspect' | 'shape'>('paint')

  // --- Save Status ---
  const lastSavedAt = ref<string | null>(new Date().toLocaleTimeString())

  // --- Computed ---
  const activeBed = computed(() => gardenBeds.value.find((b) => b.id === activeBedId.value) ?? null)

  const selectedPlantType = computed(() =>
    plantTypes.value.find((p) => p.id === selectedPlantTypeId.value) ?? null,
  )

  const selectedCell = computed(() => {
    if (!activeBed.value || !selectedCellKey.value) return null
    return activeBed.value.cells[selectedCellKey.value] ?? null
  })

  const bedStats = computed(() => {
    if (!activeBed.value) return null
    const cells = Object.values(activeBed.value.cells)
    const planted = cells.length
    const disabledCount = (activeBed.value.disabledCells ?? []).length
    const total = activeBed.value.rows * activeBed.value.cols - disabledCount
    const byType: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    const byHealth: Record<string, number> = {}
    for (const cell of cells) {
      byType[cell.plantTypeId] = (byType[cell.plantTypeId] || 0) + 1
      byStatus[cell.status] = (byStatus[cell.status] || 0) + 1
      byHealth[cell.health] = (byHealth[cell.health] || 0) + 1
    }
    return { planted, total, empty: total - planted, byType, byStatus, byHealth }
  })

  const logsForActiveBed = computed(() =>
    gardenLogs.value
      .filter((l) => l.bedId === activeBedId.value)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  )

  // --- Persist helper ---
  function persist() {
    saveState({
      plantTypes: plantTypes.value,
      gardenBeds: gardenBeds.value,
      gardenLogs: gardenLogs.value,
      activeBedId: activeBedId.value,
    })
    lastSavedAt.value = new Date().toLocaleTimeString()
  }

  // --- Actions ---
  function createBed(data: Partial<GardenBed> & { name: string; rows: number; cols: number }) {
    const bed: GardenBed = {
      id: uuidv4(),
      name: data.name,
      rows: data.rows,
      cols: data.cols,
      cellSizeInches: data.cellSizeInches ?? 12,
      season: data.season ?? 'Spring',
      year: data.year ?? new Date().getFullYear(),
      soilAmendments: data.soilAmendments ?? '',
      bedType: data.bedType ?? 'raised',
      irrigationType: data.irrigationType ?? '',
      notes: data.notes ?? '',
      cells: {},
      disabledCells: [],
    }
    gardenBeds.value.push(bed)
    activeBedId.value = bed.id
    persist()
    return bed
  }

  function deleteBed(bedId: string) {
    gardenBeds.value = gardenBeds.value.filter((b) => b.id !== bedId)
    gardenLogs.value = gardenLogs.value.filter((l) => l.bedId !== bedId)
    if (activeBedId.value === bedId) {
      activeBedId.value = gardenBeds.value[0]?.id ?? null
    }
    persist()
  }

  function setActiveBed(bedId: string) {
    activeBedId.value = bedId
    selectedCellKey.value = null
    persist()
  }

  function toggleCellShape(row: number, col: number) {
    if (!activeBed.value) return
    const key = `${row}-${col}`
    if (!activeBed.value.disabledCells) activeBed.value.disabledCells = []
    const idx = activeBed.value.disabledCells.indexOf(key)
    if (idx >= 0) {
      activeBed.value.disabledCells.splice(idx, 1)
    } else {
      // Also remove any plant in this cell when disabling
      delete activeBed.value.cells[key]
      if (selectedCellKey.value === key) selectedCellKey.value = null
      activeBed.value.disabledCells.push(key)
    }
    persist()
  }

  function isCellDisabled(row: number, col: number): boolean {
    if (!activeBed.value) return false
    const key = `${row}-${col}`
    return (activeBed.value.disabledCells ?? []).includes(key)
  }

  function paintCell(row: number, col: number) {
    if (!activeBed.value || !selectedPlantTypeId.value || toolMode.value !== 'paint') return
    const key = `${row}-${col}`
    // Don't paint on disabled cells
    if ((activeBed.value.disabledCells ?? []).includes(key)) return
    const today = new Date().toISOString().slice(0, 10)
    const instance: PlantInstance = {
      id: uuidv4(),
      plantTypeId: selectedPlantTypeId.value,
      gridRow: row,
      gridCol: col,
      variety: '',
      seedSource: '',
      status: 'planned',
      health: 'good',
      datePlanned: today,
      dateSeededIndoors: null,
      dateTransplanted: null,
      dateDirectSown: null,
      dateFirstSprout: null,
      dateFirstTrueLeaves: null,
      dateFirstFlower: null,
      dateFirstFruit: null,
      dateFirstHarvest: null,
      dateLastHarvest: null,
      dateRemoved: null,
      yieldTotal: null,
      yieldUnit: '',
      fertilizerUsed: '',
      fertilizerSchedule: '',
      wateringMethod: '',
      wateringFrequency: '',
      mulchType: '',
      pestIssues: '',
      diseaseIssues: '',
      treatmentsApplied: '',
      supportType: '',
      notes: '',
      photos: [],
      rating: null,
    }
    activeBed.value.cells[key] = instance
    persist()
  }

  function eraseCell(row: number, col: number) {
    if (!activeBed.value) return
    const key = `${row}-${col}`
    delete activeBed.value.cells[key]
    if (selectedCellKey.value === key) selectedCellKey.value = null
    persist()
  }

  function handleCellClick(row: number, col: number) {
    if (!activeBed.value) return
    const key = `${row}-${col}`
    if (toolMode.value === 'shape') {
      toggleCellShape(row, col)
    } else if (toolMode.value === 'paint') {
      paintCell(row, col)
    } else if (toolMode.value === 'erase') {
      eraseCell(row, col)
    } else if (toolMode.value === 'inspect') {
      selectedCellKey.value = activeBed.value.cells[key] ? key : null
    }
  }

  function updatePlantInstance(key: string, updates: Partial<PlantInstance>) {
    if (!activeBed.value || !activeBed.value.cells[key]) return
    Object.assign(activeBed.value.cells[key], updates)
    persist()
  }

  function addLog(log: Omit<GardenLog, 'id'>) {
    gardenLogs.value.push({ ...log, id: uuidv4() })
    persist()
  }

  function deleteLog(logId: string) {
    gardenLogs.value = gardenLogs.value.filter((l) => l.id !== logId)
    persist()
  }

  function addCustomPlantType(plant: Omit<PlantType, 'id'>) {
    const id = plant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + uuidv4().slice(0, 4)
    plantTypes.value.push({ ...plant, id })
    persist()
    return id
  }

  function deletePlantType(plantId: string) {
    // Remove from palette
    plantTypes.value = plantTypes.value.filter((p) => p.id !== plantId)
    // Deselect if selected
    if (selectedPlantTypeId.value === plantId) selectedPlantTypeId.value = null
    persist()
  }

  function updateBed(bedId: string, updates: Partial<GardenBed>) {
    const bed = gardenBeds.value.find((b) => b.id === bedId)
    if (!bed) return
    Object.assign(bed, updates)
    persist()
  }

  function exportData(): string {
    return JSON.stringify(
      {
        plantTypes: plantTypes.value,
        gardenBeds: gardenBeds.value,
        gardenLogs: gardenLogs.value,
      },
      null,
      2,
    )
  }

  function importData(json: string) {
    try {
      const data = JSON.parse(json)
      if (data.plantTypes) plantTypes.value = data.plantTypes
      if (data.gardenBeds) gardenBeds.value = data.gardenBeds
      if (data.gardenLogs) gardenLogs.value = data.gardenLogs
      activeBedId.value = gardenBeds.value[0]?.id ?? null
      persist()
      return true
    } catch {
      return false
    }
  }

  return {
    plantTypes,
    gardenBeds,
    gardenLogs,
    activeBedId,
    selectedPlantTypeId,
    selectedCellKey,
    toolMode,
    activeBed,
    selectedPlantType,
    selectedCell,
    bedStats,
    logsForActiveBed,
    lastSavedAt,
    createBed,
    deleteBed,
    setActiveBed,
    paintCell,
    eraseCell,
    handleCellClick,
    toggleCellShape,
    isCellDisabled,
    updatePlantInstance,
    addLog,
    deleteLog,
    addCustomPlantType,
    deletePlantType,
    updateBed,
    exportData,
    importData,
    persist,
  }
})
