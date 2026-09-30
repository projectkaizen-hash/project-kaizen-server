import {defineField, defineType} from 'sanity'

export const processStepType = defineType({
  name: 'processStep',
  title: 'Process Step',
  type: 'document',
  fields: [
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Position of this step on the Process page (1 = first)',
      initialValue: 1,
      validation: (rule) => rule.required().min(1).integer(),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'array',
      of: [{type: 'block'}],
      description:
        'Rich text shown when this step is active (optional — a step can be image-only)',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Falls back to a placeholder box if empty',
    }),
  ],
})
