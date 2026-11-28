import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { generateExamWithGemini } from '../services/examGenerator.js';
import type { ExamGenerationInput } from '../../src/types/exam.js';

export const examsRouter = Router();

examsRouter.post(
  '/generate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Partial<ExamGenerationInput> | undefined;
      if (!body || typeof body !== 'object') {
        throw new AppError('Invalid request body.', 400, 'INVALID_PAYLOAD');
      }

      const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
      const topic = typeof body.topic === 'string' ? body.topic.trim() : '';

      if (!subject || !topic) {
        throw new AppError('Both subject and topic are required.', 400, 'MISSING_FIELDS');
      }

      const questionCount = Number(body.questionCount);
      if (!Number.isFinite(questionCount) || questionCount < 5 || questionCount > 50) {
        throw new AppError('Question count must be between 5 and 50.', 400, 'INVALID_QUESTION_COUNT');
      }

      if (!Array.isArray(body.questionTypes) || body.questionTypes.length === 0) {
        throw new AppError('Select at least one question format.', 400, 'INVALID_QUESTION_TYPES');
      }

      const exam = await generateExamWithGemini({
        title: typeof body.title === 'string' ? body.title : undefined,
        subject,
        topic,
        academicLevel: body.academicLevel || 'Undergraduate',
        difficulty: body.difficulty || 'Medium',
        questionCount,
        questionTypes: body.questionTypes,
        totalMarks: Number(body.totalMarks) || questionCount * 5,
        durationMinutes: Number(body.durationMinutes) || 30,
        instructions: typeof body.instructions === 'string' ? body.instructions : undefined,
        sourceMode: body.sourceMode || 'prompt',
        sourcePrompt: typeof body.sourcePrompt === 'string' ? body.sourcePrompt : '',
        sourceNotes: typeof body.sourceNotes === 'string' ? body.sourceNotes : '',
        uploadedFileName: typeof body.uploadedFileName === 'string' ? body.uploadedFileName : undefined,
        uploadedFileSizeBytes:
          typeof body.uploadedFileSizeBytes === 'number' ? body.uploadedFileSizeBytes : undefined,
        uploadedFileContent:
          typeof body.uploadedFileContent === 'string' ? body.uploadedFileContent : undefined,
        uploadedFileBase64:
          typeof body.uploadedFileBase64 === 'string' ? body.uploadedFileBase64 : undefined,
        uploadedFileMimeType:
          typeof body.uploadedFileMimeType === 'string' ? body.uploadedFileMimeType : undefined,
      });

      res.status(200).json({ exam });
    } catch (err) {
      next(err);
    }
  }
);
