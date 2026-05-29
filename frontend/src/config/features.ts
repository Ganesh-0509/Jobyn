export const FEATURE_FLAGS = {
    ML_PREDICTIONS: true,         // ML model trained on 57,100 real resumes (95% role accuracy, R²=0.992)
    RAG_STUDY_MATERIALS: true,    // Enabled — 711 knowledge chunks loaded (88 skills × sections)
    VOICE_INTERVIEW: true,        // Keep — genuinely differentiated
    SKILL_GRAPH: true,            // Keep — the moat
    PROJECT_GENERATOR: true,      // Keep — useful
    PROJECT_VERIFIER: true,       // Keep — useful
    MARKET_FORECAST: true,        // Enabled — Gemini-powered market forecasts with real data sources
    INDUSTRY_ALIGNMENT: true,     // Keep
    RESUME_COMPARISON: true,      // Keep
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS
