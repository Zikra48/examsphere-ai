# ExamSphere AI — Stage 2 Backend & AI Integration Boundary

This document defines the planned production architecture for connecting **ExamSphere AI** from its Stage 1 local-state preview to live persistence and server-side AI generation.

## Security & Secret Boundary
- **Zero Client Secrets:** No `GEMINI_API_KEY`, Supabase `service_role` keys, or private credentials are stored or referenced in `/src/**`.
- **Server-Side Proxy Only:** All Gemini API requests and document ingestion pipelines must execute inside an Express/Node.js backend (`server.ts`) deployed on **Google Cloud Run**.

## Planned Infrastructure Components

1. **Authentication & Relational Persistence (Supabase)**
   - **Auth:** Email/Password + OAuth session tokens verified server-side via JWT.
   - **Database Tables:**
     - `profiles` (`id`, `full_name`, `academic_level`, `target_exam`, `preferences`)
     - `exams` (`id`, `user_id`, `title`, `subject`, `topic`, `academic_level`, `difficulty`, `duration_minutes`, `total_marks`, `source_type`)
     - `questions` (`id`, `exam_id`, `order_index`, `type`, `prompt`, `options_json`, `correct_option_index`, `marks`, `topic_tag`, `explanation`)
     - `attempts` (`id`, `exam_id`, `user_id`, `started_at`, `completed_at`, `duration_taken_seconds`, `earned_marks`, `score_percent`, `answers_json`)

2. **Server-Side Assessment Generation (`POST /api/exams/generate`)**
   - Uses `@google/genai` on the server with `GEMINI_API_KEY` injected via Cloud Run Secret Manager.
   - Enforces structured JSON Schema output (`responseSchema`) matching `Exam` and `Question[]` interfaces in `src/types/exam.ts`.
   - Parses uploaded `.pdf`, `.docx`, and `.txt` study materials via multipart upload before passing sanitized text chunks to Gemini.

3. **Client Service Migration (`src/services/apiClient.ts`)**
   - Every method in `src/services/apiClient.ts` mirrors the planned REST/RPC contract and contains explicit `// TODO` markers indicating the exact endpoint and payload transformation.
