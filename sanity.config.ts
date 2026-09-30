import {defineConfig} from 'sanity'
import {structureTool, type StructureResolver} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {singletonPlugin} from './plugins/singleton'

// Singletons: exactly one document each, always at these fixed IDs.
const SINGLETONS = [
  {title: 'Studio', id: 'studio', schemaType: 'studio'},
  {title: 'Homepage', id: 'homepage', schemaType: 'homepage'},
  {title: 'Project Info', id: 'projectInfo', schemaType: 'projectInfo'},
]

const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Singleton items — each opens one fixed document, never creates a new one
      ...SINGLETONS.map((s) =>
        S.listItem()
          .title(s.title)
          .id(s.id)
          .child(S.document().schemaType(s.schemaType).documentId(s.id)),
      ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => !SINGLETONS.some((s) => s.id === item.getId()),
      ),
    ])

export default defineConfig({
  name: 'default',
  title: 'project kaizen',

  projectId: '93vbcg5t',
  dataset: 'production',

  plugins: [
    structureTool({structure}),
    visionTool(),
    singletonPlugin(['studio', 'homepage']),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Remove the singletons from every creation menu (global +, structure +, intl menu).
    // Their only editors are the pinned, fixed-ID documents in the structure above.
    newDocumentOptions: (prev) =>
      prev.filter(
        (templateItem) =>
          templateItem.templateId !== 'studio' && templateItem.templateId !== 'homepage',
      ),
  },
})
