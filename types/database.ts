/**
 * Hand-written to match supabase/migrations.
 * Once the schema grows, regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > types/database.ts
 *
 * The domain unions (categories, statuses, control types...) are enforced in
 * Postgres by CHECK constraints rather than enums, so they are declared here as
 * string literal unions and re-exported from types/index.ts.
 */
export type ThoughtCategory =
  | "Work"
  | "Study"
  | "Relationships"
  | "Social"
  | "Decisions"
  | "Future"
  | "Family"
  | "Money"
  | "Other";

export type ThoughtStatus = "active" | "resolved" | "archived";
export type TrafficLightValue = "green" | "yellow" | "red";
export type ControlTypeValue = "control" | "influence" | "cannot_control";
export type ActionPriorityValue = "low" | "medium" | "high";
export type PredictionOutcomeValue =
  | "better_than_expected"
  | "about_what_i_expected"
  | "worse_than_expected"
  | "completely_different";

type UserRelationship<Name extends string> = {
  foreignKeyName: Name;
  columns: ["user_id"];
  isOneToOne: false;
  referencedRelation: "users";
  referencedColumns: ["id"];
};

type ThoughtRelationship<Name extends string> = {
  foreignKeyName: Name;
  columns: ["thought_id"];
  isOneToOne: false;
  referencedRelation: "thoughts";
  referencedColumns: ["id"];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      thoughts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          raw_text: string;
          category: ThoughtCategory;
          trigger: string | null;
          traffic_light: TrafficLightValue;
          status: ThoughtStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          raw_text: string;
          category?: ThoughtCategory;
          trigger?: string | null;
          traffic_light: TrafficLightValue;
          status?: ThoughtStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          raw_text?: string;
          category?: ThoughtCategory;
          trigger?: string | null;
          traffic_light?: TrafficLightValue;
          status?: ThoughtStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [UserRelationship<"thoughts_user_id_fkey">];
      };

      thought_facts: {
        Row: { id: string; thought_id: string; content: string; created_at: string };
        Insert: { id?: string; thought_id: string; content: string; created_at?: string };
        Update: { id?: string; thought_id?: string; content?: string; created_at?: string };
        Relationships: [ThoughtRelationship<"thought_facts_thought_id_fkey">];
      };

      thought_stories: {
        Row: { id: string; thought_id: string; content: string; created_at: string };
        Insert: { id?: string; thought_id: string; content: string; created_at?: string };
        Update: { id?: string; thought_id?: string; content?: string; created_at?: string };
        Relationships: [ThoughtRelationship<"thought_stories_thought_id_fkey">];
      };

      emotions: {
        Row: { id: string; thought_id: string; emotion: string; intensity: number; created_at: string };
        Insert: { id?: string; thought_id: string; emotion: string; intensity: number; created_at?: string };
        Update: { id?: string; thought_id?: string; emotion?: string; intensity?: number; created_at?: string };
        Relationships: [ThoughtRelationship<"emotions_thought_id_fkey">];
      };

      control_items: {
        Row: {
          id: string;
          thought_id: string;
          content: string;
          control_type: ControlTypeValue;
          created_at: string;
        };
        Insert: {
          id?: string;
          thought_id: string;
          content: string;
          control_type: ControlTypeValue;
          created_at?: string;
        };
        Update: {
          id?: string;
          thought_id?: string;
          content?: string;
          control_type?: ControlTypeValue;
          created_at?: string;
        };
        Relationships: [ThoughtRelationship<"control_items_thought_id_fkey">];
      };

      actions: {
        Row: {
          id: string;
          thought_id: string;
          user_id: string;
          title: string;
          due_date: string | null;
          priority: ActionPriorityValue;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thought_id: string;
          user_id: string;
          title: string;
          due_date?: string | null;
          priority?: ActionPriorityValue;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          thought_id?: string;
          user_id?: string;
          title?: string;
          due_date?: string | null;
          priority?: ActionPriorityValue;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          ThoughtRelationship<"actions_thought_id_fkey">,
          UserRelationship<"actions_user_id_fkey">,
        ];
      };

      predictions: {
        Row: {
          id: string;
          thought_id: string;
          user_id: string;
          prediction_text: string;
          confidence: number;
          expected_date: string;
          outcome: string | null;
          outcome_rating: PredictionOutcomeValue | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thought_id: string;
          user_id: string;
          prediction_text: string;
          confidence: number;
          expected_date: string;
          outcome?: string | null;
          outcome_rating?: PredictionOutcomeValue | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          thought_id?: string;
          user_id?: string;
          prediction_text?: string;
          confidence?: number;
          expected_date?: string;
          outcome?: string | null;
          outcome_rating?: PredictionOutcomeValue | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          ThoughtRelationship<"predictions_thought_id_fkey">,
          UserRelationship<"predictions_user_id_fkey">,
        ];
      };

      worry_capsules: {
        Row: {
          id: string;
          user_id: string;
          thought_id: string;
          worry_intensity: number;
          reopen_date: string;
          reopened_at: string | null;
          current_intensity: number | null;
          outcome: string | null;
          what_changed: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          thought_id: string;
          worry_intensity: number;
          reopen_date: string;
          reopened_at?: string | null;
          current_intensity?: number | null;
          outcome?: string | null;
          what_changed?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          thought_id?: string;
          worry_intensity?: number;
          reopen_date?: string;
          reopened_at?: string | null;
          current_intensity?: number | null;
          outcome?: string | null;
          what_changed?: string | null;
          created_at?: string;
        };
        Relationships: [
          ThoughtRelationship<"worry_capsules_thought_id_fkey">,
          UserRelationship<"worry_capsules_user_id_fkey">,
        ];
      };

      decision_rooms: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [UserRelationship<"decision_rooms_user_id_fkey">];
      };

      decision_options: {
        Row: {
          id: string;
          decision_room_id: string;
          name: string;
          benefits: string[];
          concerns: string[];
          known_facts: string[];
          unknowns: string[];
          controllable_items: string[];
          first_step: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          decision_room_id: string;
          name: string;
          benefits?: string[];
          concerns?: string[];
          known_facts?: string[];
          unknowns?: string[];
          controllable_items?: string[];
          first_step?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          decision_room_id?: string;
          name?: string;
          benefits?: string[];
          concerns?: string[];
          known_facts?: string[];
          unknowns?: string[];
          controllable_items?: string[];
          first_step?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decision_options_decision_room_id_fkey";
            columns: ["decision_room_id"];
            isOneToOne: false;
            referencedRelation: "decision_rooms";
            referencedColumns: ["id"];
          },
        ];
      };

      reflections: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [UserRelationship<"reflections_user_id_fkey">];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      owns_thought: {
        Args: { p_thought_id: string };
        Returns: boolean;
      };
      owns_decision_room: {
        Args: { p_room_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
