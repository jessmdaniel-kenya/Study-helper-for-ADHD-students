// src/lib/materials.ts
import type { Material } from '../stores/useAppStore'
import { ensureSession } from './auth'
import { supabase, supabaseConfigured } from './supabase'

const LOCAL_KEY = 'study-helper.materials.v1'
const BUCKET = 'study-materials'
const MAX_FILE_BYTES = 25 * 1024 * 1024
const COLUMNS = 'id,title,full_text,file_name,storage_path'

type MaterialRow = {
  id: string
  title: string
  full_text: string
  file_name: string | null
  storage_path: string | null
}

function fromRow(row: MaterialRow): Material {
  return {
    id: row.id,
    title: row.title,
    content: row.full_text,
    fileName: row.file_name || undefined,
    storagePath: row.storage_path || undefined,
    marked: false,
    progress: [],
  }
}

function readLocalMaterials(): Material[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || '[]')
    if (!Array.isArray(value)) return []
    return value.filter((item): item is Material =>
      item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.content === 'string',
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

export async function listMaterials(): Promise<Material[]> {
  if (!supabaseConfigured) return readLocalMaterials()
  await ensureSession()
  const { data, error } = await supabase
    .from('materials')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Could not sync study materials: ${error.message}`)
  return (data || []).map((row) => fromRow(row as MaterialRow))
}

export async function createMaterial(input: {
  title: string
  content: string
  file?: File | null
}): Promise<Material> {
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

  const { data, error } = await supabase
    .from('materials')
    .insert({ title, full_text: content, file_name: input.file?.name || null, storage_path: storagePath })
    .select(COLUMNS)
    .single()
  if (error) {
    if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath])
    throw new Error(`Could not save this study material: ${error.message}`)
  }
  return fromRow(data as MaterialRow)
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
    if (storageError) console.warn('The note was deleted, but its private file could not be removed.')
  }
}

export async function signedFileUrl(storagePath?: string): Promise<string | null> {
  if (!supabaseConfigured || !storagePath) return null
  await ensureSession()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 300)
  if (error) throw new Error(`Could not open the saved file: ${error.message}`)
  return data.signedUrl
}