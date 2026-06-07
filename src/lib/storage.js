/** Path stored on track.file_url — strip accidental bucket prefix before storage API calls. */
export const normalizeTrackStoragePath = (fileUrl) => {
  if (!fileUrl) return ''
  return fileUrl.replace(/^tracks\//, '')
}
