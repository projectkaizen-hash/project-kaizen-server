import {definePlugin} from 'sanity'

export const singletonPlugin = (types: string | string[]) => {
  const typeArray = Array.isArray(types) ? types : [types]

  return definePlugin({
    name: 'singletonPlugin',
    document: {
      // Hide 'Create new' for these types
      newDocumentOptions: (prev, { creationContext }) => {
        if (creationContext.type === 'global') {
          return prev.filter(
            (templateItem) => !typeArray.includes(templateItem.templateId)
          )
        }
        return prev
      },
      // Prevents creating new documents by removing create and delete actions
      // (duplicate/discard actions remain — they are part of the same reducer entry,
      // see DocumentActionDuplicate/Discard in sanity's documentActions reducer)
      actions: (prev, { schemaType }) => {
        if (typeArray.includes(schemaType)) {
          return prev.filter((item) => {
            const action = (item as any).action as string | undefined
            return action === 'update' || action === 'publish' || action === undefined
          })
        }
        return prev
      },
    },
  })
}
