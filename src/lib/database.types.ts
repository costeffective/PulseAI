export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      batches: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          summary: string | null;
          status: "processing" | "completed" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          summary?: string | null;
          status?: "processing" | "completed" | "failed";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          summary?: string | null;
          status?: "processing" | "completed" | "failed";
          created_at?: string;
        };
      };
      feedback_items: {
        Row: {
          id: string;
          batch_id: string;
          line_index: number;
          text: string;
          category: string;
          sentiment: "positive" | "negative" | "neutral";
          priority: "high" | "medium" | "low";
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          line_index: number;
          text: string;
          category: string;
          sentiment: "positive" | "negative" | "neutral";
          priority: "high" | "medium" | "low";
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          line_index?: number;
          text?: string;
          category?: string;
          sentiment?: "positive" | "negative" | "neutral";
          priority?: "high" | "medium" | "low";
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
