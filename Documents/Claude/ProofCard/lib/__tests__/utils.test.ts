import { describe, it, expect } from 'vitest'
import { generateSlug, calcDays, calcAvgLoss, calcTotalLoss } from '../utils'

describe('generateSlug', () => {
  it('returns an 8-character alphanumeric string', () => {
    const slug = generateSlug()
    expect(slug).toMatch(/^[a-z0-9]{8}$/)
  })

  it('returns different slugs each call', () => {
    expect(generateSlug()).not.toBe(generateSlug())
  })
})

describe('calcDays', () => {
  it('returns number of days between two ISO date strings', () => {
    expect(calcDays('2024-01-01', '2024-03-25')).toBe(84)
  })

  it('returns 0 for same date', () => {
    expect(calcDays('2024-01-01', '2024-01-01')).toBe(0)
  })
})

describe('calcTotalLoss', () => {
  it('returns difference between start and current weight', () => {
    expect(calcTotalLoss(198, 170)).toBe(28)
  })
})

describe('calcAvgLoss', () => {
  it('returns lbs per week given total loss and days', () => {
    expect(calcAvgLoss(28, 84)).toBeCloseTo(2.33, 1)
  })

  it('returns 0 if days is 0', () => {
    expect(calcAvgLoss(28, 0)).toBe(0)
  })
})
