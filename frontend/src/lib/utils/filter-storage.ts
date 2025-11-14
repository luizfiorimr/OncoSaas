/**
 * Utilitários para salvar e carregar filtros do localStorage
 */

export interface PatientFilters {
  searchTerm?: string;
  priorityCategory?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  cancerType?: string | null;
}

const FILTERS_STORAGE_KEY = 'medsaas-patient-filters';

/**
 * Salva os filtros no localStorage
 */
export function saveFiltersToStorage(filters: PatientFilters): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Erro ao salvar filtros no localStorage:', error);
  }
}

/**
 * Carrega os filtros do localStorage
 */
export function loadFiltersFromStorage(): PatientFilters | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!stored) return null;

    const filters = JSON.parse(stored) as PatientFilters;
    return filters;
  } catch (error) {
    console.error('Erro ao carregar filtros do localStorage:', error);
    return null;
  }
}

/**
 * Limpa os filtros salvos do localStorage
 */
export function clearFiltersFromStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar filtros do localStorage:', error);
  }
}

