import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { PlantType, PlantInstance, GardenBed, GardenGroup, GardenLog } from '../data/types'
import { defaultPlants } from '../data/plantDatabase'

const STORAGE_KEY = 'garden-planner-data'

interface SavedState {
  plantTypes: PlantType[]
  gardenBeds: GardenBed[]
  gardenGroups: GardenGroup[]
  gardenLogs: GardenLog[]
  activeBedId: string | null
  activeGroupId: string | null
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

  // --- Garden Groups ---
  const gardenGroups = ref<GardenGroup[]>(saved?.gardenGroups ?? [])

  // --- Garden Beds ---
  const gardenBeds = ref<GardenBed[]>(saved?.gardenBeds ?? [])

  // --- Garden Logs ---
  const gardenLogs = ref<GardenLog[]>(saved?.gardenLogs ?? [])

  // --- Active Bed / Group ---
  const activeBedId = ref<string | null>(saved?.activeBedId ?? null)
  const activeGroupId = ref<string | null>(saved?.activeGroupId ?? null)

  // --- Selected Plant Type (for painting) ---
  const selectedPlantTypeId = ref<string | null>(null)

  // --- Selected Cell (for detail view) ---
  const selectedCellKey = ref<string | null>(null)

  // --- Multi-select: set of selected cell keys ---
  const selectedCellKeys = ref<Set<string>>(new Set())

  // --- Tool Mode ---
  const toolMode = ref<'paint' | 'erase' | 'inspect' | 'shape'>('paint')

  // --- Save Status ---
  const lastSavedAt = ref<string | null>(new Date().toLocaleTimeString())

  // --- Computed ---
  const activeBed = computed(() => gardenBeds.value.find((b) => b.id === activeBedId.value) ?? null)

  const activeGroup = computed(() => gardenGroups.value.find((g) => g.id === activeGroupId.value) ?? null)

  const bedsInActiveGroup = computed(() => {
    if (!activeGroupId.value) return gardenBeds.value.filter((b) => !b.groupId)
    return gardenBeds.value.filter((b) => b.groupId === activeGroupId.value)
  })

  const selectedPlantType = computed(() =>
    plantTypes.value.find((p) => p.id === selectedPlantTypeId.value) ?? null,
  )

  const selectedCell = computed(() => {
    if (!activeBed.value || !selectedCellKey.value) return null
    return activeBed.value.cells[selectedCellKey.value] ?? null
  })

  const selectedCells = computed<PlantInstance[]>(() => {
    if (!activeBed.value) return []
    return [...selectedCellKeys.value]
      .map((k) => activeBed.value!.cells[k])
      .filter(Boolean)
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
      gardenGroups: gardenGroups.value,
      gardenLogs: gardenLogs.value,
      activeBedId: activeBedId.value,
      activeGroupId: activeGroupId.value,
    })
    lastSavedAt.value = new Date().toLocaleTimeString()
  }

  // --- Group Actions ---
  function createGroup(data: { name: string; description?: string; color?: string }) {
    const group: GardenGroup = {
      id: uuidv4(),
      name: data.name,
      description: data.description ?? '',
      color: data.color ?? '#166534',
      order: gardenGroups.value.length,
    }
    gardenGroups.value.push(group)
    persist()
    return group
  }

  function updateGroup(groupId: string, updates: Partial<GardenGroup>) {
    const g = gardenGroups.value.find((g) => g.id === groupId)
    if (g) { Object.assign(g, updates); persist() }
  }

  function deleteGroup(groupId: string) {
    // Unassign all beds from this group
    gardenBeds.value.forEach((b) => { if (b.groupId === groupId) b.groupId = null })
    gardenGroups.value = gardenGroups.value.filter((g) => g.id !== groupId)
    if (activeGroupId.value === groupId) activeGroupId.value = null
    persist()
  }

  function setActiveGroup(groupId: string | null) {
    activeGroupId.value = groupId
    // Clear active bed if it doesn't belong to the new group
    if (groupId !== null && activeBed.value?.groupId !== groupId) {
      const first = gardenBeds.value.find((b) => b.groupId === groupId)
      activeBedId.value = first?.id ?? null
      selectedCellKey.value = null
      selectedCellKeys.value = new Set()
    }
    persist()
  }

  function assignBedToGroup(bedId: string, groupId: string | null) {
    const bed = gardenBeds.value.find((b) => b.id === bedId)
    if (bed) { bed.groupId = groupId; persist() }
  }

  // --- Bed Actions ---
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
      groupId: activeGroupId.value,
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
    selectedCellKeys.value = new Set()
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
      delete activeBed.value.cells[key]
      if (selectedCellKey.value === key) selectedCellKey.value = null
      selectedCellKeys.value.delete(key)
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
    selectedCellKeys.value.delete(key)
    persist()
  }

  // Multi-select toggle: Ctrl+Click in inspect mode
  function toggleCellSelection(key: string, ctrlHeld: boolean) {
    if (!activeBed.value) return
    const hasPlant = !!activeBed.value.cells[key]
    if (!hasPlant) return

    if (!ctrlHeld) {
      // Single select
      selectedCellKeys.value = new Set([key])
      selectedCellKey.value = key
    } else {
      // Multi-select: toggle
      const next = new Set(selectedCellKeys.value)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      selectedCellKeys.value = next
      selectedCellKey.value = next.size === 1 ? [...next][0] : null
    }
  }

  function clearSelection() {
    selectedCellKeys.value = new Set()
    selectedCellKey.value = null
  }

  function handleCellClick(row: number, col: number, ctrlHeld = false) {
    if (!activeBed.value) return
    const key = `${row}-${col}`
    if (toolMode.value === 'shape') {
      toggleCellShape(row, col)
    } else if (toolMode.value === 'paint') {
      paintCell(row, col)
    } else if (toolMode.value === 'erase') {
      eraseCell(row, col)
    } else if (toolMode.value === 'inspect') {
      toggleCellSelection(key, ctrlHeld)
    }
  }

  function updatePlantInstance(key: string, updates: Partial<PlantInstance>) {
    if (!activeBed.value || !activeBed.value.cells[key]) return
    Object.assign(activeBed.value.cells[key], updates)
    persist()
  }

  // Bulk-update all selected cells with a partial patch
  function bulkUpdateSelected(updates: Partial<PlantInstance>) {
    if (!activeBed.value) return
    for (const key of selectedCellKeys.value) {
      if (activeBed.value.cells[key]) {
        Object.assign(activeBed.value.cells[key], updates)
      }
    }
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
    plantTypes.value = plantTypes.value.filter((p) => p.id !== plantId)
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
      { plantTypes: plantTypes.value, gardenBeds: gardenBeds.value, gardenGroups: gardenGroups.value, gardenLogs: gardenLogs.value },
      null, 2,
    )
  }

  function importData(json: string) {
    try {
      const data = JSON.parse(json)
      if (data.plantTypes) plantTypes.value = data.plantTypes
      if (data.gardenBeds) gardenBeds.value = data.gardenBeds
      if (data.gardenGroups) gardenGroups.value = data.gardenGroups
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
    gardenGroups,
    gardenBeds,
    gardenLogs,
    activeBedId,
    activeGroupId,
    selectedPlantTypeId,
    selectedCellKey,
    selectedCellKeys,
    toolMode,
    activeBed,
    activeGroup,
    bedsInActiveGroup,
    selectedPlantType,
    selectedCell,
    selectedCells,
    bedStats,
    logsForActiveBed,
    lastSavedAt,
    createGroup,
    updateGroup,
    deleteGroup,
    setActiveGroup,
    assignBedToGroup,
    createBed,
    deleteBed,
    setActiveBed,
    paintCell,
    eraseCell,
    handleCellClick,
    toggleCellShape,
    isCellDisabled,
    toggleCellSelection,
    clearSelection,
    updatePlantInstance,
    bulkUpdateSelected,
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
