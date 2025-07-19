export function extractIdFromSlug(slug: string) {
  return slug.split("-").at(-1)!
}