export interface PlantType {
  id: string
  name: string
  latinName: string
  variety: string           // specific cultivar name, e.g. 'Brandywine'
  category: 'vegetable' | 'herb' | 'fruit' | 'flower' | 'legume' | 'root' | 'leafy-green'
  emoji: string
  color: string
  daysToGermination: number | null
  daysToMaturity: number | null
  spacingInches: number
  rowSpacingInches: number
  plantDepthInches: number
  sunRequirement: 'full-sun' | 'partial-sun' | 'partial-shade' | 'full-shade'
  waterNeeds: 'low' | 'moderate' | 'high'
  soilType: string
  phRange: string
  companionPlants: string[]
  incompatiblePlants: string[]
  hardinessZones: string
  notes: string
  // Recommended defaults — auto-populated into PlantInstance on paint
  recommendedFertilizer: string
  recommendedFertilizerSchedule: string
  recommendedWateringMethod: 'drip' | 'sprinkler' | 'hand-watering' | 'soaker-hose' | 'none' | ''
  recommendedWateringFrequency: string
  recommendedMulch: string
  recommendedSupport: 'none' | 'stake' | 'cage' | 'trellis' | 'fence' | 'raised-bed-edge' | ''
  recommendedYieldUnit: 'lbs' | 'oz' | 'count' | 'bunches' | 'cups' | 'quarts' | 'gallons' | ''
  seedSource: string        // common suppliers for this variety in Michigan
  startMethod: 'direct-sow' | 'indoor-start' | 'transplant' | 'crown' | 'slip' | 'bulb'
  michiganPlantingWindow: string  // e.g. "Mid-May to early June"
}

export interface PlantInstance {
  id: string
  plantTypeId: string
  gridRow: number
  gridCol: number
  variety: string
  seedSource: string
  status: 'planned' | 'seeded-indoors' | 'transplanted' | 'direct-sown' | 'sprouted' | 'vegetative' | 'flowering' | 'fruiting' | 'harvesting' | 'dormant' | 'removed' | 'dead'
  health: 'excellent' | 'good' | 'fair' | 'stressed' | 'diseased' | 'pest-damage' | 'dead'
  datePlanned: string | null
  dateSeededIndoors: string | null
  dateTransplanted: string | null
  dateDirectSown: string | null
  dateFirstSprout: string | null
  dateFirstTrueLeaves: string | null
  dateFirstFlower: string | null
  dateFirstFruit: string | null
  dateFirstHarvest: string | null
  dateLastHarvest: string | null
  dateRemoved: string | null
  yieldTotal: number | null
  yieldUnit: 'lbs' | 'oz' | 'count' | 'bunches' | 'cups' | 'quarts' | 'gallons' | ''
  fertilizerUsed: string
  fertilizerSchedule: string
  wateringMethod: 'drip' | 'sprinkler' | 'hand-watering' | 'soaker-hose' | 'none' | ''
  wateringFrequency: string
  mulchType: string
  pestIssues: string
  diseaseIssues: string
  treatmentsApplied: string
  supportType: 'none' | 'stake' | 'cage' | 'trellis' | 'fence' | 'raised-bed-edge' | ''
  notes: string
  photos: string[]
  rating: number | null  // 1-5 rating for how well it did
}

export interface GardenBed {
  id: string
  name: string
  rows: number
  cols: number
  cellSizeInches: number
  season: string
  year: number
  soilAmendments: string
  bedType: 'raised' | 'in-ground' | 'container' | 'hydroponic'
  irrigationType: string
  notes: string
  cells: Record<string, PlantInstance>  // key: "row-col"
  disabledCells: string[]  // keys of cells excluded from the bed shape
  groupId: string | null   // optional group membership
}

export interface GardenGroup {
  id: string
  name: string
  description: string
  color: string  // accent color for the group UI
  order: number  // display order
}

export interface GardenLog {
  id: string
  bedId: string
  date: string
  type: 'planting' | 'watering' | 'fertilizing' | 'harvesting' | 'pest-control' | 'pruning' | 'observation' | 'weather' | 'other'
  title: string
  description: string
  plantInstanceIds: string[]
}

export const PLANT_STATUSES = [
  { value: 'planned', label: 'Planned', icon: '📋' },
  { value: 'seeded-indoors', label: 'Seeded Indoors', icon: '🏠' },
  { value: 'transplanted', label: 'Transplanted', icon: '🔄' },
  { value: 'direct-sown', label: 'Direct Sown', icon: '🌱' },
  { value: 'sprouted', label: 'Sprouted', icon: '🌿' },
  { value: 'vegetative', label: 'Vegetative Growth', icon: '🍃' },
  { value: 'flowering', label: 'Flowering', icon: '🌸' },
  { value: 'fruiting', label: 'Fruiting', icon: '🍅' },
  { value: 'harvesting', label: 'Harvesting', icon: '🧺' },
  { value: 'dormant', label: 'Dormant', icon: '😴' },
  { value: 'removed', label: 'Removed', icon: '🗑️' },
  { value: 'dead', label: 'Dead', icon: '💀' },
] as const

export const HEALTH_OPTIONS = [
  { value: 'excellent', label: 'Excellent', color: '#22c55e' },
  { value: 'good', label: 'Good', color: '#84cc16' },
  { value: 'fair', label: 'Fair', color: '#eab308' },
  { value: 'stressed', label: 'Stressed', color: '#f97316' },
  { value: 'diseased', label: 'Diseased', color: '#ef4444' },
  { value: 'pest-damage', label: 'Pest Damage', color: '#a855f7' },
  { value: 'dead', label: 'Dead', color: '#6b7280' },
] as const
