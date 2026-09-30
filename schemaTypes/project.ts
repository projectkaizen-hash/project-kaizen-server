import {defineField, defineType} from 'sanity'

// Shared Portable Text config: both the description and the info panel use
// the same editor (headings, quote, decorations, link annotations).
const richTextBlocks = [
  {
    type: 'block',
    styles: [
      {title: 'Normal', value: 'normal'},
      {title: 'H2', value: 'h2'},
      {title: 'H3', value: 'h3'},
      {title: 'Quote', value: 'blockquote'},
    ],
    marks: {
      decorators: [
        {title: 'Bold', value: 'strong'},
        {title: 'Italic', value: 'em'},
        {title: 'Underline', value: 'underline'},
      ],
      annotations: [
        {
          name: 'link',
          title: 'Link',
          type: 'object',
          fields: [
            {
              name: 'href',
              title: 'URL',
              type: 'url',
            },
          ],
        },
      ],
    },
  },
]

export const projectType = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subcategory',
      title: 'Sub-categories',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'subcategory'}]}],
      description:
        'Optional; e.g. "Fashion, Photography". The migration seeds these from existing category labels.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: richTextBlocks,
      description: 'Rich-text description shown under the project title.',
    }),
    defineField({
      name: 'info',
      title: 'Project Info',
      type: 'array',
      of: richTextBlocks,
      description:
        'Rich text shown in the "Info +" panel on the project page. Falls back to placeholder text while empty.',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
      validation: (rule) => rule.required(),
    }),
  ],
})
