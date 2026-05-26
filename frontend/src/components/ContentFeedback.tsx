/**
 * ContentFeedback.tsx — Inline feedback widget for study content quality.
 *
 * Renders at the bottom of each study section, allowing users to:
 * - Rate content (1-5 stars)
 * - Report errors
 * - Suggest improvements
 */

import { useState, useCallback } from 'react'
import { submitContentFeedback } from '../api/client'

interface ContentFeedbackProps {
    skill: string
    sectionIdx?: number
    contentType?: 'section' | 'overview' | 'quiz'
}

export default function ContentFeedback({ skill, sectionIdx, contentType = 'section' }: ContentFeedbackProps) {
    const [rating, setRating] = useState<number | null>(null)
    const [hoveredStar, setHoveredStar] = useState<number>(0)
    const [showForm, setShowForm] = useState(false)
    const [feedbackType, setFeedbackType] = useState<'rating' | 'error_report' | 'suggestion'>('rating')
    const [comment, setComment] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const handleStarClick = useCallback(async (star: number) => {
        setRating(star)
        setSubmitting(true)
        try {
            await submitContentFeedback({
                skill,
                section_idx: sectionIdx,
                feedback_type: 'rating',
                rating: star,
                content_type: contentType,
            })
            setSubmitted(true)
        } catch {
            // silent fail
        }
        setSubmitting(false)
    }, [skill, sectionIdx, contentType])

    const handleDetailedSubmit = useCallback(async () => {
        if (!comment.trim()) return
        setSubmitting(true)
        try {
            await submitContentFeedback({
                skill,
                section_idx: sectionIdx,
                feedback_type: feedbackType,
                rating: rating ?? undefined,
                comment: comment.trim(),
                content_type: contentType,
            })
            setSubmitted(true)
        } catch {
            // silent fail
        }
        setSubmitting(false)
    }, [skill, sectionIdx, feedbackType, rating, comment, contentType])

    if (submitted && !showForm) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(34, 197, 94, 0.1)', fontSize: 13,
                color: 'rgb(34, 197, 94)', marginTop: 12
            }}>
                <span>✓</span>
                <span>Thanks for your feedback!</span>
            </div>
        )
    }

    return (
        <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
            {/* Star Rating Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Rate this content:</span>
                <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            onClick={() => handleStarClick(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            disabled={submitting || submitted}
                            style={{
                                background: 'none', border: 'none', cursor: submitting ? 'wait' : 'pointer',
                                fontSize: 18, padding: '0 2px',
                                color: star <= (hoveredStar || rating || 0) ? '#facc15' : 'rgba(255,255,255,0.2)',
                                transition: 'color 0.15s',
                            }}
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        >
                            ★
                        </button>
                    ))}
                </div>
                {rating && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 6, padding: '3px 10px', fontSize: 11,
                            color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                        }}
                    >
                        Add details
                    </button>
                )}
            </div>

            {/* Detailed Feedback Form */}
            {showForm && !submitted && (
                <div style={{
                    marginTop: 10, padding: 12, borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        {(['error_report', 'suggestion'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFeedbackType(type)}
                                style={{
                                    background: feedbackType === type ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    border: `1px solid ${feedbackType === type ? 'rgb(99, 102, 241)' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: 6, padding: '4px 12px', fontSize: 12,
                                    color: feedbackType === type ? 'rgb(165, 180, 252)' : 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                }}
                            >
                                {type === 'error_report' ? '🐛 Report Error' : '💡 Suggest Improvement'}
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder={feedbackType === 'error_report'
                            ? 'Describe the error or inaccuracy...'
                            : 'Suggest an improvement or missing concept...'}
                        rows={3}
                        style={{
                            width: '100%', background: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                            padding: 8, fontSize: 13, color: '#e2e8f0',
                            resize: 'vertical', fontFamily: 'inherit',
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <button
                            onClick={() => { setShowForm(false); setComment('') }}
                            style={{
                                background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 6, padding: '4px 14px', fontSize: 12,
                                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDetailedSubmit}
                            disabled={!comment.trim() || submitting}
                            style={{
                                background: 'rgb(99, 102, 241)', border: 'none',
                                borderRadius: 6, padding: '4px 14px', fontSize: 12,
                                color: '#fff', cursor: comment.trim() ? 'pointer' : 'not-allowed',
                                opacity: comment.trim() ? 1 : 0.5,
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
