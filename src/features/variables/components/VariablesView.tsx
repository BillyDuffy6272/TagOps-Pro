import { useCallback, useEffect, useState } from 'react'
import { deleteVariable, listContainers, listVariables } from '../api/variables'
import {
  VARIABLE_TYPE_LABELS,
  VARIABLE_TYPES,
  type Container,
  type VariableType,
  type VariableWithContainer,
} from '../types'
import VariableCard from './VariableCard'
import VariableFormModal from './VariableFormModal'
import './VariablesView.css'

type TypeFilter = 'all' | VariableType

export default function VariablesView() {
  const [variables, setVariables] = useState<VariableWithContainer[]>([])
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingVariable, setEditingVariable] = useState<VariableWithContainer | undefined>(undefined)

  const load = useCallback(async () => {
    try {
      const [fetchedVariables, fetchedContainers] = await Promise.all([listVariables(), listContainers()])
      setVariables(fetchedVariables)
      setContainers(fetchedContainers)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load variables')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreateModal() {
    setEditingVariable(undefined)
    setModalOpen(true)
  }

  function openEditModal(variable: VariableWithContainer) {
    setEditingVariable(variable)
    setModalOpen(true)
  }

  async function handleDelete(variable: VariableWithContainer) {
    if (!window.confirm(`Delete "${variable.name}"? This can't be undone from here.`)) return
    try {
      await deleteVariable(variable.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete variable')
    }
  }

  function handleSaved() {
    setModalOpen(false)
    load()
  }

  const filteredVariables = variables.filter(v => {
    const matchesType = typeFilter === 'all' || v.variable_type === typeFilter
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div className="variables-view">
      <header className="view-header">
        <div>
          <h1 className="view-title">Variables</h1>
          <p className="view-sub">Data layer variables and constants</p>
        </div>
        <button className="new-variable-btn" onClick={openCreateModal} disabled={containers.length === 0}>
          + New variable
        </button>
      </header>

      {error && (
        <div className="view-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading ? (
        <div className="view-loading">
          <div className="view-spinner" />
          <span>Loading variables…</span>
        </div>
      ) : (
        <>
          <div className="variables-stats">
            <div className="stat-pill">
              <span className="stat-num">{variables.length}</span>
              <span className="stat-lbl">Total</span>
            </div>
          </div>

          <div className="variables-controls">
            <select
              className="view-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as TypeFilter)}
            >
              <option value="all">All types</option>
              {VARIABLE_TYPES.map(t => (
                <option key={t} value={t}>{VARIABLE_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input
              className="search-input"
              type="search"
              placeholder="Search variables…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {containers.length === 0 ? (
            <div className="view-empty">
              No containers found for your organisation yet — create one before adding variables.
            </div>
          ) : filteredVariables.length === 0 ? (
            <div className="view-empty">
              {variables.length === 0 ? 'No variables yet.' : 'No variables match your filter.'}
            </div>
          ) : (
            <div className="variables-grid">
              {filteredVariables.map(variable => (
                <VariableCard
                  key={variable.id}
                  variable={variable}
                  onEdit={() => openEditModal(variable)}
                  onDelete={() => handleDelete(variable)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <VariableFormModal
          containers={containers}
          initial={editingVariable}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
