/**
 * One-time cleanup: merges duplicate `subcategory` documents that share the
 * same (lower-cased) name under the same parent category. Keeps one document
 * per group (stable `subcategory.*` ids preferred, then the oldest), re-points
 * project references to the keeper and deletes the duplicates.
 *
 * Idempotent: safe to re-run (the second run finds nothing to merge).
 *
 * Usage:  SANITY_API_TOKEN=xxxx npm run dedupe-subcategories
 * (token needs read + write on the production dataset)
 */
import {createClient} from '@sanity/client'
// Plain-string queries (no `groq` tag) so the fetch generic below infers as an
// array, matching the style of migrate-categories.ts.

const client = createClient({
  projectId: '93vbcg5t',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

interface SubcatDoc {
  _id: string
  name: string
  _createdAt: string
  parent?: {_ref: string} | null
}

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('Set SANITY_API_TOKEN (read+write) before running:')
    console.error('  SANITY_API_TOKEN=xxxx npm run dedupe-subcategories')
    process.exit(1)
  }

  const subcats = await client.fetch<SubcatDoc[]>(
    '*[_type == "subcategory"]{_id, name, _createdAt, parent}'
  )
  console.log(`Found ${subcats.length} subcategory document(s).`)

  // Group by parent category id + lower-cased name. Same name under a
  // *different* parent is legitimate (scoped per category tab) and is kept.
  const groups = new Map<string, SubcatDoc[]>()
  for (const s of subcats) {
    const key = `${s.parent?._ref ?? ''}::${s.name.trim().toLowerCase()}`
    const group = groups.get(key) ?? []
    group.push(s)
    groups.set(key, group)
  }

  let merged = 0
  for (const [key, group] of groups) {
    if (group.length < 2) continue

    // Prefer stable migration ids ("subcategory.*"), then oldest created.
    group.sort((a, b) => {
      const aStable = a._id.startsWith('subcategory.') ? 0 : 1
      const bStable = b._id.startsWith('subcategory.') ? 0 : 1
      if (aStable !== bStable) return aStable - bStable
      return a._createdAt.localeCompare(b._createdAt)
    })
    const keeper = group[0]
    const dupes = group.slice(1)

    console.log(
      `Merging ${dupes.length} duplicate(s) of "${keeper.name}" (${key.split('::')[0] || 'no parent'}) into ${keeper._id}`
    )

    for (const dupe of dupes) {
      const projects = await client.fetch<
        {_id: string; subcategory: {_ref: string}[] | null}[]
      >(`*[_type == "project" && references("${dupe._id}")]{_id, subcategory}`)

      for (const project of projects) {
        // Re-point the dupe reference at the keeper, then dedupe by id.
        const refs = (project.subcategory ?? []).map((r) =>
          r._ref === dupe._id ? keeper._id : r._ref
        )
        const unique = [...new Set(refs)]
        await client
          .patch(project._id)
          .set({subcategory: unique.map((_ref) => ({_type: 'reference', _ref}))})
          .commit()
      }

      await client.delete(dupe._id)
      merged++
      console.log(`  Deleted ${dupe._id} (re-pointed ${projects.length} project(s))`)
    }
  }

  console.log(merged === 0 ? '\nNo duplicates found.' : `\nDeleted ${merged} duplicate(s).`)
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
