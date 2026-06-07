import * as XLSX from 'xlsx'

/**
 * Export array of objects to .xlsx download (English column headers).
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} filename
 * @param {Record<string, string>} [columnMap] - key → header label
 */
export const exportToXlsx = (rows, filename = 'export.xlsx', columnMap = null) => {
  let data = rows

  if (columnMap && rows.length > 0) {
    data = rows.map((row) => {
      const mapped = {}
      for (const [key, label] of Object.entries(columnMap)) {
        mapped[label] = row[key] ?? ''
      }
      return mapped
    })
  }

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}
