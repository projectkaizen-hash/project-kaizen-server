import {defineField, defineType} from 'sanity'

export const homepageType = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'introText',
      title: 'Intro Text',
      type: 'text',
      rows: 6,
      description: 'Paragraph shown in the top-left of the homepage',
    }),
    defineField({
      name: 'featuredProjects',
      title: 'Featured Projects',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'project'}],
        },
      ],
      description:
        'Projects shown in the homepage scroller, in order (drag to reorder). Leave empty to fall back to the first five projects.',
    }),
  ],
})
