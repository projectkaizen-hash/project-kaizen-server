import { defineType, defineField } from 'sanity'

export const studioType = defineType({
  name: 'studio',
  title: 'Studio',
  type: 'document',
  fields: [
    defineField({
      name: 'contactTitle',
      title: 'Contact Page Title',
      type: 'string',
      description: 'Heading for the "Come visit us" section on the contact page',
    }),
    defineField({
      name: 'contactDescription',
      title: 'Contact Page Description',
      type: 'text',
      description: 'Paragraph under the heading on the contact page',
      rows: 4,
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'web',
      title: 'Website',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lat',
      title: 'Latitude',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'lng',
      title: 'Longitude',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
    }),
    defineField({
      name: 'socials',
      title: 'Social Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'LinkedIn', value: 'linkedin' },
                  { title: 'Twitter', value: 'twitter' },
                ],
              },
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
            }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              description: 'Path to the icon file (e.g., /Asset 2_Insta.svg)',
            }),
          ],
        },
      ],
    }),
  ],
})
