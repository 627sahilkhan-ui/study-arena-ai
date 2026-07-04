export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak: number;
  last_study_date: string | null;
  created_at: string;
}
export interface Subject { id: string; user_id: string; name: string; color: string; created_at: string; }
export interface Note {
  id: string; user_id: string; subject_id: string | null;
  title: string; content: string; category: string; created_at: string; updated_at: string;
}
export interface StudyPlan {
  id: string; user_id: string; subject_id: string | null; title: string; description: string;
  start_date: string | null; end_date: string | null; status: 'active' | 'completed' | 'paused'; created_at: string;
}
export interface Goal {
  id: string; user_id: string; title: string; target_hours: number;
  deadline: string | null; completed: boolean; created_at: string;
}
export interface Flashcard {
  id: string; user_id: string; subject_id: string | null;
  front: string; back: string; favorite: boolean; created_at: string;
}
export interface QuizQuestion { question: string; options: string[]; answer_index: number; }
export interface Quiz {
  id: string; user_id: string; subject_id: string | null; title: string;
  questions: QuizQuestion[]; ai_generated: boolean; created_at: string;
}
export interface QuizAttempt { id: string; user_id: string; quiz_id: string; score: number; total: number; created_at: string; }
export interface StudySession { id: string; user_id: string; subject_id: string | null; minutes: number; xp_earned: number; created_at: string; }
export interface Achievement { id: string; title: string; description: string; icon: string; xp_reward: number; }
export interface Notification { id: string; user_id: string; title: string; body: string; read: boolean; created_at: string; }
