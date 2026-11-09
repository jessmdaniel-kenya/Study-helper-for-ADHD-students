// src/lib/materials.ts
import type { Material, MaterialOverview } from '../stores/useAppStore'
import { ensureSession } from './auth'
import { supabase, supabaseConfigured } from './supabase'

const LOCAL_KEY = 'study-helper.materials.v1'
const BUCKET = 'study-materials'
const MAX_FILE_BYTES = 25 * 1024 * 1024
const COLUMNS = 'id,title,full_text,file_name,storage_path'
const COLUMNS_WITH_OVERVIEW = `${COLUMNS},overview`

type MaterialRow = {
  id: string
  title: string
  full_text: string
  file_name: string | null
  storage_path: string | null
  overview: MaterialOverview | null
}

function fromRow(row: MaterialRow): Material {
  return {
    id: row.id,
    title: row.title,
    content: row.full_text,
    fileName: row.file_name || undefined,
    storagePath: row.storage_path || undefined,
    overview: row.overview && isMaterialOverview(row.overview) ? row.overview : undefined,
    marked: false,
    progress: [],
  }
}

function overviewColumnMissing(error: { code?: string; message?: string }) {
  return error.code === '42703' ||
    error.code === 'PGRST204' ||
    /column .*overview.* does not exist|could not find .*overview.*column/i.test(error.message || '')
}

function isMaterialOverview(value: unknown): value is MaterialOverview {
  if (!value || typeof value !== 'object') return false
  const overview = value as Record<string, unknown>
  return typeof overview.overview === 'string' &&
    typeof overview.summary === 'string' &&
    (overview.summaryBlocks === undefined || (
      Array.isArray(overview.summaryBlocks) && overview.summaryBlocks.every((item) => {
        if (!item || typeof item !== 'object') return false
        const block = item as Record<string, unknown>
        return (block.type === 'heading' && Number.isInteger(block.level) && typeof block.text === 'string') ||
          (block.type === 'paragraph' && typeof block.text === 'string') ||
          (block.type === 'list' && typeof block.ordered === 'boolean' && Array.isArray(block.items) && block.items.every((entry) => typeof entry === 'string'))
      })
    )) &&
    Array.isArray(overview.keyPoints) &&
    overview.keyPoints.every((item) =>
      item && typeof item === 'object' &&
      typeof item.point === 'string' && typeof item.quote === 'string',
    ) &&
    Array.isArray(overview.keyTerms) &&
    overview.keyTerms.every((item) =>
      item && typeof item === 'object' &&
      typeof item.term === 'string' && typeof item.definition === 'string',
    ) &&
    Array.isArray(overview.studyPlan) &&
    overview.studyPlan.every((step) => typeof step === 'string')
}

function readLocalMaterials(): Material[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || '[]')
    if (!Array.isArray(value)) return []
    return value.filter((item): item is Material =>
      item &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.content === 'string' &&
      typeof item.marked === 'boolean' &&
      Array.isArray(item.progress) &&
      (item.overview === undefined || isMaterialOverview(item.overview)),
    )
  } catch {
    return []
  }
}

function writeLocalMaterials(materials: Material[]) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(materials))
  } catch {
    throw new Error('This browser could not save the notes locally. Free some browser storage and try again.')
  }
}

function allowedExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (!['pdf', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
    throw new Error('Use a PDF, DOCX, TXT, MD, or Image file (PNG, JPG, WEBP).')
  }
  if (file.size > MAX_FILE_BYTES) throw new Error('Files must be 25 MB or smaller.')
  return extension
}

function validateFile(file?: File | null) {
  if (!file) return
  allowedExtension(file)
}

export async function listMaterials(): Promise<Material[]> {
  if (!supabaseConfigured) return readLocalMaterials()
  await ensureSession()
  const withOverview = await supabase
    .from('materials')
    .select(COLUMNS_WITH_OVERVIEW)
    .order('created_at', { ascending: false })
  if (withOverview.error && !overviewColumnMissing(withOverview.error)) {
    throw new Error(`Could not sync study materials: ${withOverview.error.message}`)
  }
  const result = withOverview.error
    ? await supabase.from('materials').select(COLUMNS).order('created_at', { ascending: false })
    : withOverview
  if (result.error) throw new Error(`Could not sync study materials: ${result.error.message}`)
  return (result.data || []).map((row) => fromRow(row as MaterialRow))
}

export async function createMaterial(input: {
  title: string
  content: string
  file?: File | null
}): Promise<Material> {
  validateFile(input.file)
  const title = input.title.trim().slice(0, 200) || 'Untitled document'
  const content = input.content.trim()
  if (!content) throw new Error('Add some notes before saving.')

  if (!supabaseConfigured) {
    const local: Material = {
      id: crypto.randomUUID(),
      title,
      content,
      fileName: input.file?.name,
      marked: false,
      progress: [],
    }
    writeLocalMaterials([local, ...readLocalMaterials()])
    return local
  }

  const session = await ensureSession()
  if (!session) throw new Error('Cloud sync is not configured.')

  let storagePath: string | null = null
  if (input.file) {
    const extension = allowedExtension(input.file)
    storagePath = `${session.user.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, input.file, {
        contentType: input.file.type || 'application/octet-stream',
        upsert: false,
      })
    if (uploadError) throw new Error(`Could not upload the original file: ${uploadError.message}`)
  }

  const withOverview = await supabase
    .from('materials')
    .insert({ title, full_text: content, file_name: input.file?.name || null, storage_path: storagePath })
    .select(COLUMNS_WITH_OVERVIEW)
    .single()
  const result = withOverview.error && overviewColumnMissing(withOverview.error)
    ? await supabase
      .from('materials')
      .insert({ title, full_text: content, file_name: input.file?.name || null, storage_path: storagePath })
      .select(COLUMNS)
      .single()
    : withOverview
  if (result.error) {
    let cleanupError = ''
    if (storagePath) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove([storagePath])
      if (removeError) cleanupError = ' The uploaded file may need to be removed from storage manually.'
    }
    throw new Error(`Could not save this study material: ${result.error.message}.${cleanupError}`)
  }
  return fromRow(result.data as MaterialRow)
}

export async function removeMaterial(id: string, storagePath?: string) {
  if (!supabaseConfigured) {
    writeLocalMaterials(readLocalMaterials().filter((item) => item.id !== id))
    return
  }
  await ensureSession()
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) throw new Error(`Could not delete this study material: ${error.message}`)
  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath])
    if (storageError) throw new Error('The material was deleted, but its private original file could not be removed from storage.')
  }
}

export async function saveMaterialOverview(id: string, overview: MaterialOverview): Promise<void> {
  if (!supabaseConfigured) {
    const materials = readLocalMaterials()
    const updated = materials.map((material) => material.id === id ? { ...material, overview } : material)
    if (!updated.some((material) => material.id === id)) throw new Error('This material is no longer available.')
    writeLocalMaterials(updated)
    return
  }
  await ensureSession()
  const { data, error } = await supabase.from('materials').update({ overview }).eq('id', id).select('id').maybeSingle()
  if (error && overviewColumnMissing(error)) {
    throw new Error('Summaries need the Supabase material-overview migration. In the Supabase SQL Editor, run supabase/migrations/02_ai_material_overviews.sql, then retry.')
  }
  if (error) throw new Error(`Could not save this material overview: ${error.message}`)
  if (!data) throw new Error('This material is no longer available.')
}

export async function signedFileUrl(storagePath?: string): Promise<string | null> {
  if (!supabaseConfigured || !storagePath) return null
  await ensureSession()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 300)
  if (error) throw new Error(`Could not open the saved file: ${error.message}`)
  return data.signedUrl
}
