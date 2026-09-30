/**
 * One-time migration:
 *  1. Creates `category` documents for the three legacy tab values.
 *  2. Parses each project's legacy `categoryLabel` ("Fashion, Photography > Web Design/Dev")
 *     into new `subcategory` documents under the right parent category and
 *     stores them on the project as a reference array.
 *  3. Rewrites the legacy string `project.category` into a reference.
 *
 * Idempotent: safe to re-run. Already-migrated projects are skipped.
 *
 * Usage:  SANITY_API_TOKEN=xxxx npm run migrate-categories
 * (token needs read + write on the production dataset)
 */
import {createClient} from '@sanity/client'

const client = createClient({
  projectId: '93vbcg5t',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

/** Legacy tab values -> category doc definitions (order = tab position). */
const CATEGORIES = [
  {legacy: 'architecture', name: 'Architecture', slug: 'architecture', order: 1},
  {legacy: 'graphic design', name: 'Graphic Design', slug: 'graphic-design', order: 2},
  {legacy: 'speculatives', name: 'Speculatives', slug: 'speculatives', order: 3},
]

function categoryId(slug: string) {
  return `category.${slug}`
}

/** "Web Design/Dev" -> "web-design-dev" */
function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function subcategoryId(slug: string) {
  return `subcategory.${slug}`
}

async function ensureCategories() {
  const map = new Map<string, string>()
  for (const cat of CATEGORIES) {
    const id = categoryId(cat.slug)
    const existing = await client.getDocument(id)
    if (!existing) {
      await client.createIfNotExists({
        _id: id,
        _type: 'category',
        name: cat.name,
        slug: {_type: 'slug', current: cat.slug},
        order: cat.order,
      })
      console.log(`Created category: ${cat.name} (${id})`)
    } else {
      console.log(`Category exists: ${cat.name} (${id})`)
    }
    // Map both the slug AND the legacy string value to the document id.
    map.set(cat.slug, id)
    map.set(cat.legacy, id)
  }
  return map
}

/**
 * The first segment of a legacy label is the *display* category text
 * ("Architecture, Furniture"), which doesn't always equal the tab the
 * project lives under — so we trust the project's own `category` string
 * for the parent and only harvest sub-candidates from segment 1.
 */
async function ensureSubcategory(
  name: string,
  parentCategorySlug: string,
  order: number
): Promise<string> {
  const slug = slugify(name)
  const id = subcategoryId(slug)
  const existing = await client.getDocument(id)
  if (!existing) {
    await client.createIfNotExists({
      _id: id,
      _type: 'subcategory',
      name,
      slug: {_type: 'slug', current: slug},
      parent: {_type: 'reference', _ref: categoryId(parentCategorySlug)},
      order,
    })
    console.log(`  Created subcategory: ${name} (${id}, under ${parentCategorySlug})`)
  } else if (typeof existing.parent?._ref !== 'string' || !existing.parent._ref) {
    // Exists (created for another parent) — leave it; first parent wins.
  }
  return id
}

/** Parses "Fashion, Photography > Web Design/Dev" into per-side lists. */
function parseLabel(label: string) {
  const [leftRaw = '', rightRaw = ''] = label.split('>').map((s) => s.trim())
  const left = leftRaw.split(',').map((s) => s.trim()).filter(Boolean)
  const right = rightRaw.split(',').map((s) => s.trim()).filter(Boolean)
  return {left, right}
}

async function migrateProjects(categoryMap: Map<string, string>) {
  const projects = await client.fetch<
    {_id: string; name: string; category: unknown; categoryLabel?: string; subcategory?: unknown}[]
  >(`*[_type == "project"] {_id, name, category, categoryLabel, subcategory}`)

  let migrated = 0
  for (const project of projects) {
    const raw = project.category as {_type?: string; _ref?: string} | string | null

    // Determine the parent category id (string -> map, or existing reference).
    let parentRefId: string | null = null
    if (typeof raw === 'string') {
      parentRefId = categoryMap.get(raw.trim().toLowerCase()) ?? null
    } else if (raw && typeof raw === 'object' && raw._type === 'reference' && raw._ref) {
      parentRefId = raw._ref // already migrated category
    }

    const needsCategoryPatch = typeof raw === 'string' && parentRefId !== null
    const alreadyHasSubcats =
      Array.isArray(project.subcategory) && project.subcategory.length > 0

    if (!needsCategoryPatch && alreadyHasSubcats) continue // fully migrated

    if (typeof raw === 'string' && parentRefId === null) {
      console.warn(`Skipping ${project.name}: no category doc for "${raw}"`)
      continue
    }

    const patches: Record<string, unknown> = {}

    if (needsCategoryPatch && parentRefId) {
      patches.category = {_type: 'reference', _ref: parentRefId}
    }

    // Build subcategory references from the label's left side
    // ("Fashion, Photography") — skipping the segment that just repeats
    // the tab name itself (e.g. "Architecture" under architecture tab).
    if (!alreadyHasSubcats && project.categoryLabel) {
      const parentCategorySlug =
        CATEGORIES.find((c) => categoryId(c.slug) === parentRefId)?.slug ?? ''
      const {left} = parseLabel(project.categoryLabel)
      const refIds: string[] = []
      let order = 1
      for (const name of left) {
        if (parentCategorySlug && name.toLowerCase() === parentCategorySlug) continue
        refIds.push(await ensureSubcategory(name, parentCategorySlug, order++))
      }
      if (refIds.length > 0) {
        patches.subcategory = refIds.map((_ref) => ({_type: 'reference', _ref}))
      }
    }

    if (Object.keys(patches).length === 0) continue

    await client.patch(project._id).set(patches).commit()
    console.log(`Migrated: ${project.name}`)
    migrated++
  }

  console.log(`\nPatched ${migrated} project(s).`)
}

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('Set SANITY_API_TOKEN (read+write) before running:')
    console.error('  SANITY_API_TOKEN=xxxx npm run migrate-categories')
    process.exit(1)
  }

  const categoryMap = await ensureCategories()
  await migrateProjects(categoryMap)
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
