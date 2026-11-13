import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { acceptanceCoverageMatrix, BUG_CSV_HEADER, BUG_SEVERITIES, BUG_STATUSES, getCoverageIssues } from '../../scripts/quality/acceptance-coverage.mjs'
import { isCliEntrypoint, summarizeIssues, toBugCsvRows, validateIssues, writeBugCsv } from '../../scripts/quality/validate-coverage.mjs'

describe('acceptance coverage matrix', () => {
  it('maps all 74 PRD acceptance criteria with concrete statuses', () => {
    expect(acceptanceCoverageMatrix).toHaveLength(74)
    expect(acceptanceCoverageMatrix.map((item) => item.requirement_id)).toEqual(
      Array.from({ length: 74 }, (_, index) => `PRD-${String(index + 1).padStart(3, '0')}`)
    )
    expect(acceptanceCoverageMatrix.every((item) => item.status && item.status !== 'unknown')).toBe(true)
  })

  it('generates bug issues for missing and partial requirements', () => {
    const detectedAt = '2026-05-05T00:00:00.000Z'
    const issues = getCoverageIssues(acceptanceCoverageMatrix, detectedAt)

    expect(issues.length).toBeGreaterThan(0)
    expect(validateIssues(issues)).toEqual([])
    expect(issues.every((issue) => issue.created_at === detectedAt)).toBe(true)
    expect(issues.every((issue) => issue.requirement_id.startsWith('PRD-'))).toBe(true)
    expect(issues.some((issue) => issue.severity === 'High')).toBe(false)
  })

  it('serializes bugs with the fixed CSV header and escaped values', () => {
    const rows = toBugCsvRows([
      {
        id: 'BUG-001',
        severity: 'High',
        status: 'Open',
        module: 'frontend',
        file: 'src/example.vue',
        requirement_id: 'PRD-001',
        summary: 'contains, comma',
        steps: 'step 1',
        expected: 'expected',
        actual: 'actual',
        owner: 'unassigned',
        detected_by: 'test',
        created_at: '2026-05-05T00:00:00.000Z',
        fixed_at: '',
        notes: 'quote "value"'
      }
    ])

    expect(rows[0]).toBe(BUG_CSV_HEADER.join(','))
    expect(rows[1]).toContain('"contains, comma"')
    expect(rows[1]).toContain('"quote ""value"""')
  })

  it('summarizes issues by severity and status enums', () => {
    const issues = getCoverageIssues(acceptanceCoverageMatrix, '2026-05-05T00:00:00.000Z')
    const summary = summarizeIssues(issues)

    expect(summary.total).toBe(issues.length)
    expect(Object.keys(summary.bySeverity).every((severity) => BUG_SEVERITIES.includes(severity))).toBe(true)
    expect(Object.keys(summary.byStatus).every((status) => BUG_STATUSES.includes(status))).toBe(true)
  })

  it('writes bugs.csv rows with requirement IDs', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'coverage-bugs-'))

    try {
      const targetPath = join(tempDir, 'bugs.csv')
      const issues = getCoverageIssues(
        [
          {
            requirement_id: 'PRD-999',
            summary: 'backend-only missing requirement',
            frontend_files: [],
            backend_endpoints: ['/api/v1/example'],
            test_cases: [],
            status: 'missing'
          }
        ],
        '2026-05-05T00:00:00.000Z'
      )

      await writeBugCsv(issues, targetPath)

      const csv = await readFile(targetPath, 'utf8')
      expect(csv.split('\n')[0]).toBe(BUG_CSV_HEADER.join(','))
      expect(csv).toContain('PRD-999')
      expect(csv).toContain('backend')
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('rejects bug rows without required identifiers', () => {
    expect(
      validateIssues([
        {
          id: 'BUG-999',
          severity: 'High',
          status: 'Open',
          module: 'frontend',
          file: 'src/example.vue',
          requirement_id: '',
          summary: 'missing requirement id',
          steps: 'step 1',
          expected: 'expected',
          actual: 'actual',
          owner: 'unassigned',
          detected_by: 'test',
          created_at: '2026-05-05T00:00:00.000Z',
          fixed_at: '',
          notes: ''
        }
      ])
    ).toContain('BUG-999: empty field requirement_id')
  })

  it('detects the validation CLI entry point', () => {
    const scriptPath = fileURLToPath(new URL('../../scripts/quality/validate-coverage.mjs', import.meta.url))
    const otherPath = fileURLToPath(new URL('../../scripts/quality/acceptance-coverage.mjs', import.meta.url))

    expect(isCliEntrypoint(['node', scriptPath])).toBe(true)
    expect(isCliEntrypoint(['node', otherPath])).toBe(false)
  })
})
