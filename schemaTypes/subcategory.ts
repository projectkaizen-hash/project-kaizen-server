import {defineField, defineType} from 'sanity'

export const subcategoryType = defineType({
  name: 'subcategory',
  title: 'Sub-category',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Shown as the sub-category filter on the Projects page',
      validation: (rule) => rule.required(),
    }),
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
      name: 'parent',
      title: 'Parent Category',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Sort position within its parent category',
      initialValue: 1,
      validation: (rule) => rule.required().min(1).integer(),
    }),
  ],
})
