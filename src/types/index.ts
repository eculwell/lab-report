export type QuestionType = 'TEXT' | 'IMAGE';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  order: number;
}

export interface Lab {
  id: string;
  title: string;
  professorName: string;
  className: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  questionId: string;
  textContent?: string;
  imageKey?: string;
  imageUrl?: string; // presigned URL, resolved at request time
}

export interface Submission {
  id: string;
  labId: string;
  studentName: string;
  answers: Answer[];
  createdAt: string;
}

// Professor setup form values
export interface LabFormValues {
  title: string;
  professorName: string;
  className: string;
  questions: QuestionDraft[];
}

export interface QuestionDraft {
  id: string; // client-side only until saved
  text: string;
  type: QuestionType;
  order: number;
}

// Student submission form values
export interface SubmissionFormValues {
  studentName: string;
  answers: Record<string, AnswerDraft>; // keyed by questionId
}

export interface AnswerDraft {
  textContent: string;
  imageFile?: File | null;
  imagePreviewUrl?: string | null;
}
