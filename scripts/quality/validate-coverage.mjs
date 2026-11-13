import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { acceptanceCoverageMatrix, BUG_CSV_HEADER, BUG_SEVERITIES, BUG_STATUSES, getCoverageIssues } from './acceptance-coverage.mjs'

const outputPath = new URL('../../bugs.csv', import.meta.url)
const outputFilePath = fileURLToPath(outputPath)

function escapeCsvValue(value) {
  const text = Array.isArray(value) ? value.join(';') : String(value ?? '')
  if (!/[",\n\r]/.test(text)) return text
  return `"${text.replaceAll('"', '""')}"`
}

export function toBugCsvRows(issues) {
  return [
    BUG_CSV_HEADER.join(','),
    ...issues.map((issue) => BUG_CSV_HEADER.map((field) => escapeCsvValue(issue[field])).join(','))
  ]
}

export function validateIssues(issues) {
  const errors = []
  for (const issue of issues) {
    if (!BUG_SEVERITIES.includes(issue.severity)) {
      errors.push(`${issue.id}: invalid severity ${issue.severity}`)
    }
    if (!BUG_STATUSES.includes(issue.status)) {
      errors.push(`${issue.id}: invalid status ${issue.status}`)
    }
    for (const field of BUG_CSV_HEADER) {
      if (!(field in issue)) {
        errors.push(`${issue.id}: missing field ${field}`)
        continue
      }
      if (['id', 'requirement_id', 'summary'].includes(field) && !String(issue[field] ?? '').trim()) {
        errors.push(`${issue.id}: empty field ${field}`)
      }
    }
    if (issue.requirement_id && !/^PRD-\d{3}$/.test(issue.requirement_id)) {
      errors.push(`${issue.id}: invalid requirement_id ${issue.requirement_id}`)
    }
  }
  return errors
}

export function summarizeIssues(issues) {
  return issues.reduce(
    (summary, issue) => {
      summary.total += 1
      summary.bySeverity[issue.severity] = (summary.bySeverity[issue.severity] ?? 0) + 1
      summary.byStatus[issue.status] = (summary.byStatus[issue.status] ?? 0) + 1
      return summary
    },
    { total: 0, bySeverity: {}, byStatus: {} }
  )
}

function toFilePath(targetPath) {
  return targetPath instanceof URL ? fileURLToPath(targetPath) : targetPath
}

export function isCliEntrypoint(argv = process.argv) {
  const entrypoint = argv[1]
  return Boolean(entrypoint && pathToFileURL(resolve(entrypoint)).href === import.meta.url)
}

export async function writeBugCsv(issues, targetPath = outputPath) {
  const errors = validateIssues(issues)
  if (errors.length) {
    throw new Error(`Invalid bug issues:\n${errors.join('\n')}`)
  }

  const filePath = toFilePath(targetPath)
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, `${toBugCsvRows(issues).join('\n')}\n`, 'utf8')
}

export async function runCoverageValidation() {
  const issues = getCoverageIssues(acceptanceCoverageMatrix)
  await writeBugCsv(issues)
  const summary = summarizeIssues(issues)
  return {
    matrixTotal: acceptanceCoverageMatrix.length,
    issuesTotal: issues.length,
    summary,
    output: outputFilePath
  }
}

if (isCliEntrypoint()) {
  runCoverageValidation()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2))
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    })
}
