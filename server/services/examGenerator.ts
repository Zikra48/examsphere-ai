import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import zlib from 'zlib';
import { env, isGeminiConfigured } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type {
  AcademicLevel,
  DifficultyLevel,
  Exam,
  ExamGenerationInput,
  Question,
  QuestionType,
} from '../../src/types/exam.js';

const GEMINI_MODEL = 'gemini-4-hydrogen';
const GEMINI_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorDetails(err: unknown): { status?: number; rawMessage: string } {
  if (err && typeof err === 'object') {
    const anyErr = err as { status?: number; code?: number; message?: string };
    const rawMessage = typeof anyErr.message === 'string' ? anyErr.message : String(err);
    let status = typeof anyErr.status === 'number' ? anyErr.status : typeof anyErr.code === 'number' ? anyErr.code : undefined;

    if (!status && rawMessage.includes('{')) {
      try {
        const parsed = JSON.parse(rawMessage) as { error?: { code?: number; status?: string } };
        if (typeof parsed?.error?.code === 'number') {
          status = parsed.error.code;
        }
      } catch {
        // Ignore JSON parse errors on message text
      }
    }
    return { status, rawMessage };
  }
  return { rawMessage: String(err) };
}

function isTransientGeminiError(err: unknown): boolean {
  const { status, rawMessage } = extractErrorDetails(err);
  if (status === 503 || status === 429 || status === 502 || status === 504) {
    return true;
  }
  return /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|temporarily|overloaded|ETIMEDOUT|ECONNRESET|fetch failed/i.test(
    rawMessage
  );
}

function mapGeminiError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const { status, rawMessage } = extractErrorDetails(err);

  if (status === 503 || /UNAVAILABLE|high demand|overloaded/i.test(rawMessage)) {
    return new AppError(
      'The AI generation service is temporarily experiencing high demand. Please wait a few moments and try again.',
      503,
      'AI_SERVICE_UNAVAILABLE'
    );
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(rawMessage)) {
    return new AppError(
      'AI generation rate limit or quota exceeded. Please wait a moment and try again.',
      429,
      'AI_RATE_LIMITED'
    );
  }
  if (status === 401 || status === 403 || /API_KEY_INVALID|PERMISSION_DENIED|invalid api key/i.test(rawMessage)) {
    return new AppError(
      'AI service authentication failed. Please verify GEMINI_API_KEY in server configuration.',
      502,
      'AI_AUTH_ERROR'
    );
  }
  if (status === 400) {
    return new AppError(
      'Invalid request parameters sent to the AI model. Please adjust your exam inputs and try again.',
      400,
      'AI_BAD_REQUEST'
    );
  }
  return new AppError(
    'Unable to generate examination questions from the AI service right now. Please try again.',
    502,
    'AI_GENERATION_FAILED'
  );
}

interface RawGeneratedQuestion {
  type: QuestionType;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  topicTag: string;
  difficulty: Exclude<DifficultyLevel, 'Mixed'>;
  explanation: string;
}

const GENERIC_BANNED_OPTION_PATTERNS = [
  /^option\s*[a-d]$/i,
  /^choice\s*[a-d]$/i,
  /^all of the above$/i,
  /^none of the above$/i,
  /^both [a-d] and [a-d]$/i,
  /^enforces conservation of core invariants/i,
  /^assumes zero variance regardless of boundary/i,
  /^substitutes an empirical heuristic in place of/i,
  /^reverses the causal dependency between primary/i,
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeText(a).split(' ').filter((w) => w.length > 2));
  const wordsB = new Set(normalizeText(b).split(' ').filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection += 1;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function distributeMarks(totalMarks: number, count: number): number[] {
  const safeCount = Math.max(1, count);
  const safeTotal = Math.max(safeCount, totalMarks);
  const base = Math.floor(safeTotal / safeCount);
  const remainder = safeTotal % safeCount;
  return Array.from({ length: safeCount }, (_, idx) => (idx < remainder ? base + 1 : base));
}

function extractDocxTextFromBase64(base64Data: string): string {
  try {
    const buf = Buffer.from(base64Data, 'base64');
    // Walk ZIP local file headers to extract word/document.xml without external deps
    let offset = 0;
    while (offset + 30 <= buf.length) {
      if (buf.readUInt32LE(offset) !== 0x04034b50) break;
      const compression = buf.readUInt16LE(offset + 8);
      const compressedSize = buf.readUInt32LE(offset + 18);
      const fileNameLength = buf.readUInt16LE(offset + 26);
      const extraFieldLength = buf.readUInt16LE(offset + 28);
      const nameStart = offset + 30;
      const nameEnd = nameStart + fileNameLength;
      const fileName = buf.subarray(nameStart, nameEnd).toString('utf8');
      const dataStart = nameEnd + extraFieldLength;

      // Handle data descriptor (bit 3) if compressedSize is 0
      let entrySize = compressedSize;
      if (entrySize === 0 && compression !== 0) {
        const nextSig = buf.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), dataStart);
        const centralSig = buf.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), dataStart);
        const end = nextSig !== -1 ? nextSig : centralSig !== -1 ? centralSig : buf.length;
        entrySize = Math.max(0, end - dataStart);
      }

      const dataEnd = Math.min(buf.length, dataStart + entrySize);
      if (fileName === 'word/document.xml') {
        const rawSlice = buf.subarray(dataStart, dataEnd);
        const xmlBuf =
          compression === 0
            ? rawSlice
            : compression === 8
              ? zlib.inflateRawSync(rawSlice)
              : null;
        if (!xmlBuf) return '';
        const xml = xmlBuf.toString('utf8');
        return xml
          .replace(/<\/w:p>/g, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/[ \t]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
          .slice(0, 32000);
      }
      if (entrySize === 0) break;
      offset = dataEnd;
    }
  } catch {
    return '';
  }
  return '';
}

function shuffleMcqOptions(q: RawGeneratedQuestion, questionIdx: number): RawGeneratedQuestion {
  if (q.type !== 'multiple_choice' || q.options.length !== 4) {
    return q;
  }

  // Avoid shuffling if options explicitly reference option letters
  if (q.options.some((opt) => /\b(option|choice)\s*[a-d]\b/i.test(opt))) {
    return q;
  }

  const tagged = q.options.map((text, idx) => ({
    text,
    isCorrect: idx === q.correctOptionIndex,
  }));

  // Deterministic + randomized Fisher-Yates shuffle, then ensure varied correct slot distribution
  for (let i = tagged.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tagged[i], tagged[j]] = [tagged[j], tagged[i]];
  }

  // Ensure the correct position rotates evenly rather than clustering on index 0
  const currentCorrect = tagged.findIndex((item) => item.isCorrect);
  const desiredSlot = (questionIdx + Math.floor(Math.random() * 4)) % 4;
  if (currentCorrect !== -1 && currentCorrect !== desiredSlot) {
    [tagged[currentCorrect], tagged[desiredSlot]] = [tagged[desiredSlot], tagged[currentCorrect]];
  }

  return {
    ...q,
    options: tagged.map((item) => item.text),
    correctOptionIndex: tagged.findIndex((item) => item.isCorrect),
  };
}

export interface ValidationResult {
  valid: RawGeneratedQuestion[];
  rejectedReasons: string[];
}

export function validateGeneratedQuestions(
  candidates: RawGeneratedQuestion[],
  allowedTypes: QuestionType[],
  existingAccepted: RawGeneratedQuestion[] = []
): ValidationResult {
  const valid: RawGeneratedQuestion[] = [];
  const rejectedReasons: string[] = [];

  const seenPrompts: string[] = existingAccepted.map((q) => q.prompt);
  const seenOptionSignatures = new Set<string>(
    existingAccepted
      .filter((q) => q.type === 'multiple_choice')
      .map((q) => [...q.options].map(normalizeText).sort().join('||'))
  );
  const seenOptionBuckets: string[][] = existingAccepted
    .filter((q) => q.type === 'multiple_choice')
    .map((q) => q.options.map(normalizeText));

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    const label = `Q${i + 1}`;

    if (!item || typeof item !== 'object') {
      rejectedReasons.push(`${label}: malformed question object`);
      continue;
    }

    const qType: QuestionType =
      item.type === 'true_false' && allowedTypes.includes('true_false')
        ? 'true_false'
        : allowedTypes.includes('multiple_choice')
          ? 'multiple_choice'
          : allowedTypes[0];

    const prompt = typeof item.prompt === 'string' ? item.prompt.trim() : '';
    const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : '';
    const topicTag = typeof item.topicTag === 'string' ? item.topicTag.trim() : '';

    if (prompt.length < 12) {
      rejectedReasons.push(`${label}: prompt too short or empty`);
      continue;
    }

    if (explanation.length < 15) {
      rejectedReasons.push(`${label}: explanation too short or empty`);
      continue;
    }

    const normPrompt = normalizeText(prompt);
    const duplicatePrompt = seenPrompts.some(
      (prev) => normalizeText(prev) === normPrompt || jaccardSimilarity(prev, prompt) >= 0.78
    );
    if (duplicatePrompt) {
      rejectedReasons.push(`${label}: duplicate or near-duplicate question stem`);
      continue;
    }

    if (qType === 'true_false') {
      const idx = item.correctOptionIndex === 1 ? 1 : item.correctOptionIndex === 0 ? 0 : -1;
      if (idx === -1) {
        rejectedReasons.push(`${label}: invalid True/False correctOptionIndex`);
        continue;
      }

      seenPrompts.push(prompt);
      valid.push({
        type: 'true_false',
        prompt,
        options: ['True', 'False'],
        correctOptionIndex: idx,
        topicTag: topicTag || 'Core Concepts',
        difficulty:
          item.difficulty === 'Easy' || item.difficulty === 'Hard' ? item.difficulty : 'Medium',
        explanation,
      });
      continue;
    }

    // Multiple Choice validation
    if (!Array.isArray(item.options) || item.options.length !== 4) {
      rejectedReasons.push(`${label}: MCQ must contain exactly 4 options`);
      continue;
    }

    const trimmedOptions = item.options.map((opt) => (typeof opt === 'string' ? opt.trim() : ''));
    if (trimmedOptions.some((opt) => opt.length === 0)) {
      rejectedReasons.push(`${label}: MCQ contains empty option text`);
      continue;
    }

    if (trimmedOptions.some((opt) => GENERIC_BANNED_OPTION_PATTERNS.some((re) => re.test(opt)))) {
      rejectedReasons.push(`${label}: MCQ contains banned generic placeholder option`);
      continue;
    }

    const normalizedOpts = trimmedOptions.map(normalizeText);
    if (normalizedOpts.some((opt) => opt.length === 0) || new Set(normalizedOpts).size !== 4) {
      rejectedReasons.push(`${label}: MCQ contains duplicate or non-distinct options`);
      continue;
    }

    if (
      !Number.isInteger(item.correctOptionIndex) ||
      item.correctOptionIndex < 0 ||
      item.correctOptionIndex > 3
    ) {
      rejectedReasons.push(`${label}: invalid MCQ correctOptionIndex (${String(item.correctOptionIndex)})`);
      continue;
    }

    const signature = [...normalizedOpts].sort().join('||');
    if (seenOptionSignatures.has(signature)) {
      rejectedReasons.push(`${label}: identical option set reused from another question`);
      continue;
    }

    // Reject if >= 2 non-trivial options (longer than 12 chars) are identical to another question's options
    const overlapsExistingSet = seenOptionBuckets.some((prevOpts) => {
      let overlap = 0;
      for (const opt of normalizedOpts) {
        if (opt.length > 12 && prevOpts.includes(opt)) overlap += 1;
      }
      return overlap >= 2;
    });

    if (overlapsExistingSet) {
      rejectedReasons.push(`${label}: too many identical options shared with another question`);
      continue;
    }

    seenPrompts.push(prompt);
    seenOptionSignatures.add(signature);
    seenOptionBuckets.push(normalizedOpts);

    valid.push({
      type: 'multiple_choice',
      prompt,
      options: trimmedOptions,
      correctOptionIndex: item.correctOptionIndex,
      topicTag: topicTag || 'Core Concepts',
      difficulty:
        item.difficulty === 'Easy' || item.difficulty === 'Hard' ? item.difficulty : 'Medium',
      explanation,
    });
  }

  return { valid, rejectedReasons };
}

function buildDifficultyGuidance(difficulty: DifficultyLevel, academicLevel: AcademicLevel): string {
  switch (difficulty) {
    case 'Easy':
      return `Difficulty = Easy (${academicLevel}): Focus on foundational definitions, direct principles, primary mechanisms, and single-step identification without trick wording.`;
    case 'Medium':
      return `Difficulty = Medium (${academicLevel}): Focus on conceptual application, comparative reasoning, multi-step analysis, and interpreting realistic domain scenarios.`;
    case 'Hard':
      return `Difficulty = Hard (${academicLevel}): Focus on edge cases, boundary conditions, failure modes, subtle theoretical distinctions, trade-off analysis, and complex synthesis.`;
    case 'Mixed':
    default:
      return `Difficulty = Mixed (${academicLevel}): Balance across Easy (~30% foundational), Medium (~45% applied analysis), and Hard (~25% deep edge-case synthesis). Tag each question accurately.`;
  }
}

function buildQuestionTypeGuidance(questionTypes: QuestionType[], count: number): string {
  const hasMcq = questionTypes.includes('multiple_choice');
  const hasTf = questionTypes.includes('true_false');
  if (hasMcq && hasTf) {
    const tfCount = Math.max(1, Math.round(count * 0.2));
    const mcqCount = count - tfCount;
    return `Generate ${mcqCount} "multiple_choice" questions (each with 4 distinct A-D options) and ${tfCount} "true_false" questions (options strictly ["True", "False"]).`;
  }
  if (hasTf) {
    return `Generate strictly "true_false" questions (every item must have type "true_false" and options strictly ["True", "False"]).`;
  }
  return `Generate strictly "multiple_choice" questions (every item must have type "multiple_choice" and exactly 4 distinct options).`;
}

function createGenerationSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ['multiple_choice', 'true_false'],
            },
            prompt: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctOptionIndex: { type: Type.INTEGER },
            topicTag: { type: Type.STRING },
            difficulty: {
              type: Type.STRING,
              enum: ['Easy', 'Medium', 'Hard'],
            },
            explanation: { type: Type.STRING },
          },
          required: [
            'type',
            'prompt',
            'options',
            'correctOptionIndex',
            'topicTag',
            'difficulty',
            'explanation',
          ],
        },
      },
    },
    required: ['questions'],
  };
}

async function callGeminiForQuestions(
  ai: GoogleGenAI,
  input: ExamGenerationInput,
  requestedCount: number,
  neededTypes: QuestionType[],
  avoidPrompts: string[],
  extractedDocText: string,
  hasInlinePdf: boolean
): Promise<RawGeneratedQuestion[]> {
  const difficultyGuide = buildDifficultyGuidance(input.difficulty, input.academicLevel);
  const typeGuide = buildQuestionTypeGuidance(neededTypes, requestedCount);

  const materialSection = (() => {
    if (input.sourceMode === 'notes' && input.sourceNotes.trim()) {
      return `STUDY NOTES PROVIDED BY USER:\n"""\n${input.sourceNotes.trim().slice(0, 32000)}\n"""`;
    }
    if (input.sourceMode === 'document') {
      if (extractedDocText) {
        return `UPLOADED DOCUMENT (${input.uploadedFileName || 'document'}) EXTRACTED CONTENT:\n"""\n${extractedDocText.slice(0, 32000)}\n"""`;
      }
      if (hasInlinePdf) {
        return `An uploaded PDF document (${input.uploadedFileName || 'study_material.pdf'}) is attached directly to this request. Ground questions in its actual concepts and terminology.`;
      }
      return `Uploaded document reference: ${input.uploadedFileName || 'syllabus document'}.`;
    }
    return `TOPIC GUIDANCE PROMPT:\n"""\n${(input.sourcePrompt || `${input.subject}: ${input.topic}`).trim().slice(0, 6000)}\n"""`;
  })();

  const avoidanceNote =
    avoidPrompts.length > 0
      ? `\nDO NOT repeat or paraphrase any of these already-generated questions:\n${avoidPrompts.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}\n`
      : '';

  const systemInstruction = [
    'You are an expert academic assessment author and psychometrician for ExamSphere AI.',
    'Generate rigorous, unambiguous, subject-authentic examination questions.',
    'STRICT QUALITY RULES:',
    '1. Every MCQ MUST have exactly 4 completely distinct, substantive, question-specific answer choices tailored ONLY to that specific question.',
    '2. NEVER reuse or recycle an option set across different questions. Each question requires fresh, bespoke distractors rooted in real domain misconceptions.',
    '3. NEVER use "All of the above", "None of the above", "Both A and B", or placeholder labels like "Option A".',
    '4. Exactly ONE option may be unambiguously correct. Distractors must be clearly incorrect upon careful subject reasoning.',
    '5. Vary the correctOptionIndex across 0, 1, 2, and 3 naturally across questions.',
    '6. In "explanation", explain the underlying principle and why the correct answer is right and distractors are wrong WITHOUT referencing option letters like "Option A" or "Choice B".',
    '7. Keep topicTag concise (2-5 words) naming the specific sub-concept tested.',
  ].join('\n');

  const promptText = `
Create exactly ${requestedCount} high-quality examination questions with these specifications:
- Exam Title: ${input.title?.trim() || `${input.subject}: ${input.topic}`}
- Subject: ${input.subject.trim()}
- Topic / Chapter: ${input.topic.trim()}
- Academic Level: ${input.academicLevel}
- ${difficultyGuide}
- ${typeGuide}
${input.instructions?.trim() ? `- Additional Instructions: ${input.instructions.trim()}` : ''}

${materialSection}
${avoidanceNote}

Return JSON strictly matching the schema with a "questions" array of length ${requestedCount}.
`.trim();

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];

  if (
    hasInlinePdf &&
    input.uploadedFileBase64 &&
    input.uploadedFileMimeType === 'application/pdf'
  ) {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: input.uploadedFileBase64,
      },
    });
  }
  parts.push({ text: promptText });

  const modelPlan = [
    { model: GEMINI_MODEL, useLowThinking: true, delayBeforeMs: 0 },
    { model: GEMINI_MODEL, useLowThinking: true, delayBeforeMs: 1500 },
    { model: GEMINI_FALLBACK_MODEL, useLowThinking: false, delayBeforeMs: 1500 },
  ];

  let responseText: string | undefined;
  let lastError: unknown;

  for (const step of modelPlan) {
    if (step.delayBeforeMs > 0) {
      await sleep(step.delayBeforeMs);
    }
    try {
      const response = await ai.models.generateContent({
        model: step.model,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: createGenerationSchema(),
          ...(step.useLowThinking
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });
      responseText = response.text;
      if (responseText) {
        break;
      }
      lastError = new AppError('Gemini returned an empty response while generating the exam.', 502, 'AI_EMPTY_RESPONSE');
    } catch (err) {
      lastError = err;
      if (!isTransientGeminiError(err)) {
        throw mapGeminiError(err);
      }
    }
  }

  const rawText = responseText;
  if (!rawText) {
    if (lastError) {
      throw mapGeminiError(lastError);
    }
    throw new AppError('Gemini returned an empty response while generating the exam.', 502, 'AI_EMPTY_RESPONSE');
  }

  let parsed: { questions?: RawGeneratedQuestion[] };
  try {
    parsed = JSON.parse(rawText) as { questions?: RawGeneratedQuestion[] };
  } catch {
    throw new AppError('Gemini returned malformed JSON output. Please retry generation.', 502, 'AI_INVALID_JSON');
  }

  if (!Array.isArray(parsed.questions)) {
    throw new AppError('Gemini response did not include a questions array.', 502, 'AI_SCHEMA_MISMATCH');
  }

  return parsed.questions;
}

export async function generateExamWithGemini(input: ExamGenerationInput): Promise<Exam> {
  if (!isGeminiConfigured()) {
    throw new AppError(
      'AI generation is not configured on the server: GEMINI_API_KEY is missing.',
      503,
      'GEMINI_NOT_CONFIGURED'
    );
  }

  const subject = input.subject.trim();
  const topic = input.topic.trim();
  const questionCount = Math.min(50, Math.max(5, Math.round(input.questionCount)));
  const totalMarks = Math.min(200, Math.max(questionCount, Math.round(input.totalMarks)));
  const durationMinutes = Math.min(180, Math.max(5, Math.round(input.durationMinutes)));
  const allowedTypes: QuestionType[] =
    Array.isArray(input.questionTypes) && input.questionTypes.length > 0
      ? input.questionTypes
      : ['multiple_choice'];

  let extractedDocText = (input.uploadedFileContent || '').trim();
  const isPdf =
    input.sourceMode === 'document' &&
    Boolean(input.uploadedFileBase64) &&
    (input.uploadedFileMimeType === 'application/pdf' ||
      /\.pdf$/i.test(input.uploadedFileName || ''));

  const isDocx =
    input.sourceMode === 'document' &&
    Boolean(input.uploadedFileBase64) &&
    /\.docx$/i.test(input.uploadedFileName || '');

  if (isDocx && !extractedDocText && input.uploadedFileBase64) {
    extractedDocText = extractDocxTextFromBase64(input.uploadedFileBase64);
  }

  if (
    input.sourceMode === 'document' &&
    !isPdf &&
    !extractedDocText
  ) {
    throw new AppError(
      'Could not extract readable text from the uploaded document. Please upload a .txt, .pdf, or text-based .docx file, or paste your notes directly.',
      400,
      'UNREADABLE_DOCUMENT'
    );
  }

  const ai = new GoogleGenAI({
    apiKey: env.geminiApiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });

  const accepted: RawGeneratedQuestion[] = [];
  const rejectionLog: string[] = [];
  const maxAttempts = 3; // 1 initial + up to 2 controlled repair retries

  for (let attempt = 1; attempt <= maxAttempts && accepted.length < questionCount; attempt++) {
    const remaining = questionCount - accepted.length;
    const rawBatch = await callGeminiForQuestions(
      ai,
      input,
      remaining,
      allowedTypes,
      accepted.map((q) => q.prompt),
      extractedDocText,
      isPdf
    );

    const { valid, rejectedReasons } = validateGeneratedQuestions(rawBatch, allowedTypes, accepted);
    rejectionLog.push(...rejectedReasons);

    for (const q of valid) {
      if (accepted.length < questionCount) {
        accepted.push(shuffleMcqOptions(q, accepted.length));
      }
    }
  }

  if (accepted.length < questionCount) {
    throw new AppError(
      `AI could only validate ${accepted.length} of ${questionCount} distinct questions (${rejectionLog.slice(0, 3).join('; ') || 'quality validation check failed'}). Please try again or refine the topic.`,
      502,
      'AI_VALIDATION_FAILED'
    );
  }

  const examId = `exam_${Date.now()}`;
  const marksArray = distributeMarks(totalMarks, questionCount);

  const questions: Question[] = accepted.map((raw, idx) => ({
    id: `${examId}_q_${idx + 1}`,
    examId,
    order: idx + 1,
    type: raw.type,
    prompt: raw.prompt,
    options: raw.options,
    correctOptionIndex: raw.correctOptionIndex,
    marks: marksArray[idx],
    topicTag: raw.topicTag,
    difficulty: raw.difficulty,
    explanation: raw.explanation,
  }));

  const sourceSummary =
    input.sourceMode === 'document' && input.uploadedFileName
      ? `${input.uploadedFileName} (${Math.max(1, Math.round((input.uploadedFileSizeBytes ?? 2048) / 1024))} KB)`
      : input.sourceMode === 'notes'
        ? `Study Notes (${input.sourceNotes.trim().split(/\s+/).length} words)`
        : input.sourcePrompt.trim() || `${subject}: ${topic}`;

  const now = new Date().toISOString();
  return {
    id: examId,
    title: input.title?.trim() || `${subject}: ${topic}`,
    subject,
    topic,
    academicLevel: input.academicLevel,
    difficulty: input.difficulty,
    durationMinutes,
    totalMarks: marksArray.reduce((a, b) => a + b, 0),
    questionCount: questions.length,
    ...(input.instructions?.trim() ? { instructions: input.instructions.trim() } : {}),
    sourceType: input.sourceMode,
    sourceSummary,
    createdAt: now,
    updatedAt: now,
    questions,
  };
}
