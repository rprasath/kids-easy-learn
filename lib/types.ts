export type SkillId = string;
export type SkillMode = "flashcards" | "quiz";

export type ThemeToken = {
  accent: string;
  surface: string;
};

export type SkillFieldDefinition = {
  key: string;
  label: string;
};

export type FieldValueQuestionTemplate = {
  id: string;
  kind: "field-value";
  prompt: string;
  promptHint: string;
  correctFieldKey: string;
  optionFieldKey?: string;
  optionValues?: string[];
};

export type IdentifyItemQuestionTemplate = {
  id: string;
  kind: "identify-item";
  prompt: string;
  promptHint: string;
};

export type QuizTemplate = FieldValueQuestionTemplate | IdentifyItemQuestionTemplate;

export type SkillDefinition = {
  id: SkillId;
  title: string;
  sessionLabel: string;
  itemLabel: string;
  description: string;
  theme: ThemeToken;
  supportedModes: SkillMode[];
  contentFile: string;
  status: "active" | "coming-soon";
  fields: SkillFieldDefinition[];
  badgeFieldKey?: string;
  detailFieldKeys: string[];
  questionTemplates: QuizTemplate[];
};

export type LearningCardItem = {
  id: string;
  skillId: SkillId;
  name: string;
  badge?: string;
  description?: string;
  attributes: Record<string, string>;
  facts: string[];
  funFacts?: string[];
  clues: string[];
  tags?: string[];
};

export type SkillContentPack = {
  skillId: SkillId;
  version: number;
  items: LearningCardItem[];
};

export type LearningSessionConfig = {
  selectedSkillIds: SkillId[];
  mode: SkillMode;
  questionCount: number;
  stepSeconds: number;
  shuffle: boolean;
};

export type QuizQuestion = {
  id: string;
  skillId: SkillId;
  itemId: string;
  prompt: string;
  promptHint: string;
  templateId: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
};

export type QuizAnswer = {
  questionId: string;
  itemId: string;
  skillId: SkillId;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
};

export type QuizRoundResult = {
  selectedSkillIds: SkillId[];
  score: number;
  total: number;
  answers: QuizAnswer[];
};

export type SkillProgress = {
  skillId: SkillId;
  cardsViewed: string[];
  favoriteItemIds: string[];
  quizzesCompleted: number;
  bestScore: number;
  currentStreak: number;
  lastPlayedAt: string | null;
};
