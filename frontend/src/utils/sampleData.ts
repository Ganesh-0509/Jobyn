import type { UploadResult, PredictResult } from '../api/client'

/**
 * Hardcoded sample analysis data for users who want to try CampusSync
 * without uploading their own resume. Represents a realistic mid-tier
 * Software Developer candidate (68% readiness).
 */
export const SAMPLE_ANALYSIS: UploadResult = {
    role: 'Software Developer',
    final_score: 68,
    readiness_category: 'Placement Ready',
    core_coverage_percent: 62,
    optional_coverage_percent: 40,
    project_score_percent: 70,
    ats_score_percent: 72,
    structure_score_percent: 65,
    missing_core_skills: ['System Design', 'Docker', 'Testing'],
    missing_optional_skills: ['Kubernetes', 'CI/CD'],
    recommendations: [
        { skill: 'System Design', priority: 'Critical', reason: 'Essential for technical interviews at top companies' },
        { skill: 'Docker', priority: 'Critical', reason: 'Most companies expect containerization knowledge' },
        { skill: 'Testing', priority: 'High', reason: 'Shows engineering maturity and code quality awareness' },
    ],
    detected_skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'REST API', 'MongoDB'],
    sections_detected: ['Education', 'Experience', 'Projects', 'Skills', 'Summary'],
    raw_text: 'Sample Resume — Software Developer\n\nEducation: B.Tech Computer Science\nExperience: 1 year internship\nProjects: E-commerce app, Chat application, Portfolio website\nSkills: Python, JavaScript, React, Node.js, SQL, Git, REST API, MongoDB',
    links: [],
    resume_id: null,
    analysis_id: null,
    filename: 'sample-resume.pdf',
}

export const SAMPLE_PREDICTION: PredictResult = {
    predicted_role: 'Software Developer',
    confidence: 0.78,
    resume_score: 68,
    weak_areas: ['System Design', 'Docker', 'Testing'],
    model_version: 'v2.0-sample',
    inference_time_ms: 0,
}
