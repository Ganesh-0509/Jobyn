import { describe, it, expect } from 'vitest'
import {
    getReadinessClass,
    getIndustryAlignment,
} from '../context/ResumeContext'

describe('ResumeContext helpers', () => {
    describe('getReadinessClass', () => {
        it('returns Beginner for score < 40', () => {
            expect(getReadinessClass(0)).toBe('Beginner')
            expect(getReadinessClass(39)).toBe('Beginner')
        })
        it('returns Developing for 40-60', () => {
            expect(getReadinessClass(40)).toBe('Developing')
            expect(getReadinessClass(60)).toBe('Developing')
        })
        it('returns Placement Ready for 61-80', () => {
            expect(getReadinessClass(61)).toBe('Placement Ready')
            expect(getReadinessClass(80)).toBe('Placement Ready')
        })
        it('returns Interview Ready for 81+', () => {
            expect(getReadinessClass(81)).toBe('Interview Ready')
            expect(getReadinessClass(100)).toBe('Interview Ready')
        })
    })

    describe('getIndustryAlignment', () => {
        it('computes alignment percentages', () => {
            const result = getIndustryAlignment(80)
            expect(result.service).toBeLessThanOrEqual(100)
            expect(result.product).toBeLessThanOrEqual(100)
            expect(result.startup).toBeLessThanOrEqual(100)
            expect(result.service).toBeGreaterThan(result.product)
            expect(result.product).toBeGreaterThan(result.startup)
        })
        it('caps at 100', () => {
            const result = getIndustryAlignment(100)
            expect(result.service).toBe(100)
        })
    })

})
