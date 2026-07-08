export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_jobs: {
        Row: {
          brand_id: string | null
          completed_at: string | null
          cost_estimate: number | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          input: Json
          job_type: Database["public"]["Enums"]["steward_ai_job_type"]
          metadata: Json
          model_name: string | null
          model_provider: string | null
          organization_id: string
          output: Json
          related_asset_id: string | null
          related_post_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["steward_ai_job_status"]
          token_usage: Json
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          input?: Json
          job_type: Database["public"]["Enums"]["steward_ai_job_type"]
          metadata?: Json
          model_name?: string | null
          model_provider?: string | null
          organization_id: string
          output?: Json
          related_asset_id?: string | null
          related_post_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["steward_ai_job_status"]
          token_usage?: Json
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          input?: Json
          job_type?: Database["public"]["Enums"]["steward_ai_job_type"]
          metadata?: Json
          model_name?: string | null
          model_provider?: string | null
          organization_id?: string
          output?: Json
          related_asset_id?: string | null
          related_post_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["steward_ai_job_status"]
          token_usage?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_related_asset_id_fkey"
            columns: ["related_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_comments: {
        Row: {
          approval_id: string
          author_id: string
          body: string
          created_at: string
          id: string
          metadata: Json
        }
        Insert: {
          approval_id: string
          author_id: string
          body: string
          created_at?: string
          id?: string
          metadata?: Json
        }
        Update: {
          approval_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "approval_comments_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "content_approvals"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          approval_id: string
          approver_role: string | null
          assigned_to: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          metadata: Json
          notes: string | null
          status: Database["public"]["Enums"]["steward_approval_status"]
          step_order: number
          updated_at: string
        }
        Insert: {
          approval_id: string
          approver_role?: string | null
          assigned_to?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          status?: Database["public"]["Enums"]["steward_approval_status"]
          step_order?: number
          updated_at?: string
        }
        Update: {
          approval_id?: string
          approver_role?: string | null
          assigned_to?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          status?: Database["public"]["Enums"]["steward_approval_status"]
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "content_approvals"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          alt_text: string | null
          approval_status: string
          archived_at: string | null
          brand_id: string | null
          content_category: string | null
          created_at: string
          detected_entities: Json
          duration_seconds: number | null
          event_context: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          height: number | null
          id: string
          location_context: string | null
          metadata: Json | null
          mime_type: string | null
          organization_id: string
          public_url: string | null
          storage_bucket: string | null
          storage_path: string | null
          tags: Json | null
          transcription: string | null
          type: string
          updated_at: string
          uploaded_by: string | null
          url: string | null
          usage_rights: string | null
          version: string
          visual_analysis: Json
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          approval_status?: string
          archived_at?: string | null
          brand_id?: string | null
          content_category?: string | null
          created_at?: string
          detected_entities?: Json
          duration_seconds?: number | null
          event_context?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          height?: number | null
          id?: string
          location_context?: string | null
          metadata?: Json | null
          mime_type?: string | null
          organization_id: string
          public_url?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          tags?: Json | null
          transcription?: string | null
          type: string
          updated_at?: string
          uploaded_by?: string | null
          url?: string | null
          usage_rights?: string | null
          version?: string
          visual_analysis?: Json
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          approval_status?: string
          archived_at?: string | null
          brand_id?: string | null
          content_category?: string | null
          created_at?: string
          detected_entities?: Json
          duration_seconds?: number | null
          event_context?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          height?: number | null
          id?: string
          location_context?: string | null
          metadata?: Json | null
          mime_type?: string | null
          organization_id?: string
          public_url?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          tags?: Json | null
          transcription?: string | null
          type?: string
          updated_at?: string
          uploaded_by?: string | null
          url?: string | null
          usage_rights?: string | null
          version?: string
          visual_analysis?: Json
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audience_growth_snapshots: {
        Row: {
          brand_id: string | null
          collected_at: string
          followers: number
          followers_gained: number
          id: string
          metadata: Json
          organization_id: string
          social_account_id: string | null
          unfollows: number
        }
        Insert: {
          brand_id?: string | null
          collected_at?: string
          followers?: number
          followers_gained?: number
          id?: string
          metadata?: Json
          organization_id: string
          social_account_id?: string | null
          unfollows?: number
        }
        Update: {
          brand_id?: string | null
          collected_at?: string
          followers?: number
          followers_gained?: number
          id?: string
          metadata?: Json
          organization_id?: string
          social_account_id?: string | null
          unfollows?: number
        }
        Relationships: [
          {
            foreignKeyName: "audience_growth_snapshots_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_growth_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_growth_snapshots_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_growth_snapshots_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      audience_segments: {
        Row: {
          brand_id: string
          created_at: string
          demographics: Json
          description: string | null
          id: string
          interests: Json
          is_primary: boolean
          metadata: Json
          name: string
          organization_id: string
          pain_points: Json
          preferred_platforms: Json
          slug: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          demographics?: Json
          description?: string | null
          id?: string
          interests?: Json
          is_primary?: boolean
          metadata?: Json
          name: string
          organization_id: string
          pain_points?: Json
          preferred_platforms?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          demographics?: Json
          description?: string | null
          id?: string
          interests?: Json
          is_primary?: boolean
          metadata?: Json
          name?: string
          organization_id?: string
          pain_points?: Json
          preferred_platforms?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audience_segments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audience_segments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_type: string
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          brand_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          action: string
          actor_type?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          brand_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          action?: string
          actor_type?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          brand_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: Database["public"]["Enums"]["steward_automation_action_type"]
          brand_id: string
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          last_run_at: string | null
          metadata: Json
          name: string
          next_run_at: string | null
          organization_id: string
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["steward_automation_trigger_type"]
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: Database["public"]["Enums"]["steward_automation_action_type"]
          brand_id: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          metadata?: Json
          name: string
          next_run_at?: string | null
          organization_id: string
          trigger_config?: Json
          trigger_type: Database["public"]["Enums"]["steward_automation_trigger_type"]
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: Database["public"]["Enums"]["steward_automation_action_type"]
          brand_id?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          metadata?: Json
          name?: string
          next_run_at?: string | null
          organization_id?: string
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["steward_automation_trigger_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blackout_dates: {
        Row: {
          brand_id: string | null
          created_at: string
          ends_at: string
          id: string
          metadata: Json
          organization_id: string
          reason: string | null
          starts_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          ends_at: string
          id?: string
          metadata?: Json
          organization_id: string
          reason?: string | null
          starts_at: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blackout_dates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blackout_dates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_offers: {
        Row: {
          brand_id: string
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string | null
          headline: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          offer_type: string | null
          organization_id: string
          slug: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          offer_type?: string | null
          organization_id: string
          slug: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          headline?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          offer_type?: string | null
          organization_id?: string
          slug?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_offers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_offers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          address: string | null
          ai_system_instructions: string | null
          archived_at: string | null
          audience_description: string | null
          avatar_url: string | null
          brand_voice: string | null
          business_name: string | null
          city: string | null
          color: string | null
          competitor_notes: string | null
          country: string | null
          created_at: string
          cta_preferences: Json
          email: string | null
          hashtag_bank: Json
          id: string
          ideal_customer_profiles: Json
          industry: string | null
          is_default: boolean
          logo_asset_id: string | null
          metadata: Json
          name: string
          offer_language: Json
          organization_id: string
          phone: string | null
          platform_priorities: Json
          posting_goals: Json
          slug: string
          state: string | null
          tone_settings: Json
          updated_at: string
          visual_style_notes: string | null
          website: string | null
          words_to_avoid: Json
          words_to_use: Json
        }
        Insert: {
          address?: string | null
          ai_system_instructions?: string | null
          archived_at?: string | null
          audience_description?: string | null
          avatar_url?: string | null
          brand_voice?: string | null
          business_name?: string | null
          city?: string | null
          color?: string | null
          competitor_notes?: string | null
          country?: string | null
          created_at?: string
          cta_preferences?: Json
          email?: string | null
          hashtag_bank?: Json
          id?: string
          ideal_customer_profiles?: Json
          industry?: string | null
          is_default?: boolean
          logo_asset_id?: string | null
          metadata?: Json
          name: string
          offer_language?: Json
          organization_id: string
          phone?: string | null
          platform_priorities?: Json
          posting_goals?: Json
          slug: string
          state?: string | null
          tone_settings?: Json
          updated_at?: string
          visual_style_notes?: string | null
          website?: string | null
          words_to_avoid?: Json
          words_to_use?: Json
        }
        Update: {
          address?: string | null
          ai_system_instructions?: string | null
          archived_at?: string | null
          audience_description?: string | null
          avatar_url?: string | null
          brand_voice?: string | null
          business_name?: string | null
          city?: string | null
          color?: string | null
          competitor_notes?: string | null
          country?: string | null
          created_at?: string
          cta_preferences?: Json
          email?: string | null
          hashtag_bank?: Json
          id?: string
          ideal_customer_profiles?: Json
          industry?: string | null
          is_default?: boolean
          logo_asset_id?: string | null
          metadata?: Json
          name?: string
          offer_language?: Json
          organization_id?: string
          phone?: string | null
          platform_priorities?: Json
          posting_goals?: Json
          slug?: string
          state?: string | null
          tone_settings?: Json
          updated_at?: string
          visual_style_notes?: string | null
          website?: string | null
          words_to_avoid?: Json
          words_to_use?: Json
        }
        Relationships: [
          {
            foreignKeyName: "brands_logo_asset_id_fkey"
            columns: ["logo_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_locations: {
        Row: {
          address: string | null
          brand_id: string
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          metadata: Json
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand_id: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          metadata?: Json
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand_id?: string
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          metadata?: Json
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_locations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          brand_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          goal: string | null
          id: string
          name: string
          organization_id: string
          post_count: number
          start_date: string | null
          status: string
          total_engagement: number
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          organization_id: string
          post_count?: number
          start_date?: string | null
          status: string
          total_engagement?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          organization_id?: string
          post_count?: number
          start_date?: string | null
          status?: string
          total_engagement?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          brand_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          post_id: string
          requested_by: string | null
          revision_notes: string | null
          status: Database["public"]["Enums"]["steward_approval_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          post_id: string
          requested_by?: string | null
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["steward_approval_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          post_id?: string
          requested_by?: string | null
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["steward_approval_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_approvals_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_approvals_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar_entries: {
        Row: {
          brand_id: string
          campaign_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          platform: Database["public"]["Enums"]["steward_platform"] | null
          post_id: string | null
          queue_order: number
          requires_approval: boolean
          scheduled_for: string
          status: string
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          platform?: Database["public"]["Enums"]["steward_platform"] | null
          post_id?: string | null
          queue_order?: number
          requires_approval?: boolean
          scheduled_for: string
          status?: string
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          campaign_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          platform?: Database["public"]["Enums"]["steward_platform"] | null
          post_id?: string | null
          queue_order?: number
          requires_approval?: boolean
          scheduled_for?: string
          status?: string
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_entries_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_entries_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_goals: {
        Row: {
          brand_id: string
          created_at: string
          goal_type: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          organization_id: string
          period_end: string | null
          period_start: string | null
          target_metric: string | null
          target_value: number | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          goal_type: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          target_metric?: string | null
          target_value?: number | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          goal_type?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          target_metric?: string | null
          target_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_goals_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_insights: {
        Row: {
          brand_id: string
          confidence: number | null
          created_at: string
          id: string
          insight_key: string
          insight_type: string
          insight_value: Json
          metadata: Json
          organization_id: string
          period_end: string | null
          period_start: string | null
          recommended_actions: Json
          sample_size: number | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          confidence?: number | null
          created_at?: string
          id?: string
          insight_key: string
          insight_type: string
          insight_value?: Json
          metadata?: Json
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          recommended_actions?: Json
          sample_size?: number | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          confidence?: number | null
          created_at?: string
          id?: string
          insight_key?: string
          insight_type?: string
          insight_value?: Json
          metadata?: Json
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          recommended_actions?: Json
          sample_size?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_insights_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_intake_items: {
        Row: {
          ai_recommendations: Json
          ai_summary: string | null
          brand_id: string | null
          created_at: string
          created_by: string | null
          detected_audience: string | null
          detected_content_type: string | null
          detected_topic: string | null
          id: string
          ingested_post_id: string | null
          media_asset_ids: Json
          metadata: Json
          organization_id: string
          processed_at: string | null
          raw_text: string | null
          source_platform:
            | Database["public"]["Enums"]["steward_platform"]
            | null
          source_type: Database["public"]["Enums"]["steward_content_intake_source_type"]
          source_url: string | null
          status: Database["public"]["Enums"]["steward_content_intake_status"]
          updated_at: string
        }
        Insert: {
          ai_recommendations?: Json
          ai_summary?: string | null
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          detected_audience?: string | null
          detected_content_type?: string | null
          detected_topic?: string | null
          id?: string
          ingested_post_id?: string | null
          media_asset_ids?: Json
          metadata?: Json
          organization_id: string
          processed_at?: string | null
          raw_text?: string | null
          source_platform?:
            | Database["public"]["Enums"]["steward_platform"]
            | null
          source_type: Database["public"]["Enums"]["steward_content_intake_source_type"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["steward_content_intake_status"]
          updated_at?: string
        }
        Update: {
          ai_recommendations?: Json
          ai_summary?: string | null
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          detected_audience?: string | null
          detected_content_type?: string | null
          detected_topic?: string | null
          id?: string
          ingested_post_id?: string | null
          media_asset_ids?: Json
          metadata?: Json
          organization_id?: string
          processed_at?: string | null
          raw_text?: string | null
          source_platform?:
            | Database["public"]["Enums"]["steward_platform"]
            | null
          source_type?: Database["public"]["Enums"]["steward_content_intake_source_type"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["steward_content_intake_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_intake_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_intake_items_ingested_post_id_fkey"
            columns: ["ingested_post_id"]
            isOneToOne: false
            referencedRelation: "ingested_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_intake_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pillars: {
        Row: {
          brand_id: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          organization_id: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          organization_id: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_pillars_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pillars_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_topics: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          keywords: Json
          metadata: Json
          name: string
          organization_id: string
          pillar_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          keywords?: Json
          metadata?: Json
          name: string
          organization_id: string
          pillar_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          keywords?: Json
          metadata?: Json
          name?: string
          organization_id?: string
          pillar_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_topics_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_topics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_topics_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "content_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          ends_at: string | null
          event_type: string | null
          id: string
          is_promoted: boolean
          location_id: string | null
          metadata: Json
          name: string
          organization_id: string
          registration_url: string | null
          slug: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          id?: string
          is_promoted?: boolean
          location_id?: string | null
          metadata?: Json
          name: string
          organization_id: string
          registration_url?: string | null
          slug: string
          starts_at: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          id?: string
          is_promoted?: boolean
          location_id?: string | null
          metadata?: Json
          name?: string
          organization_id?: string
          registration_url?: string | null
          slug?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "business_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ingested_posts: {
        Row: {
          ai_recommendations: Json
          ai_summary: string | null
          brand_id: string | null
          created_at: string
          detected_audience: string | null
          detected_content_type: string | null
          detected_topic: string | null
          external_id: string
          fetched_at: string
          id: string
          media_asset_ids: Json
          metadata: Json
          organization_id: string | null
          payload: Json
          platform: string
          processed_at: string | null
          raw_text: string | null
          source_type: string
          source_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_recommendations?: Json
          ai_summary?: string | null
          brand_id?: string | null
          created_at?: string
          detected_audience?: string | null
          detected_content_type?: string | null
          detected_topic?: string | null
          external_id: string
          fetched_at?: string
          id?: string
          media_asset_ids?: Json
          metadata?: Json
          organization_id?: string | null
          payload?: Json
          platform: string
          processed_at?: string | null
          raw_text?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_recommendations?: Json
          ai_summary?: string | null
          brand_id?: string | null
          created_at?: string
          detected_audience?: string | null
          detected_content_type?: string | null
          detected_topic?: string | null
          external_id?: string
          fetched_at?: string
          id?: string
          media_asset_ids?: Json
          metadata?: Json
          organization_id?: string | null
          payload?: Json
          platform?: string
          processed_at?: string | null
          raw_text?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingested_posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingested_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          brand_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          metadata: Json
          notification_type: Database["public"]["Enums"]["steward_notification_type"]
          organization_id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          brand_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          notification_type: Database["public"]["Enums"]["steward_notification_type"]
          organization_id: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          brand_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          notification_type?: Database["public"]["Enums"]["steward_notification_type"]
          organization_id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          brand_id: string
          created_at: string
          expires_at: string
          provider: string
          purpose: string | null
          state: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          expires_at: string
          provider: string
          purpose?: string | null
          state: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          expires_at?: string
          provider?: string
          purpose?: string | null
          state?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          brand_id: string
          created_at: string
          cta_phone: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          headline: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          offer_code: string | null
          organization_id: string
          slug: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          cta_phone?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          headline: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          offer_code?: string | null
          organization_id: string
          slug: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          cta_phone?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          headline?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          offer_code?: string | null
          organization_id?: string
          slug?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          invited_by: string | null
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          archived_at: string | null
          billing_plan: string
          billing_status: string
          business_category: string | null
          created_at: string
          created_by: string | null
          default_brand_id: string | null
          default_locale: string
          id: string
          logo_url: string | null
          name: string
          onboarding_status: string
          org_type: string | null
          owner_id: string
          settings: Json
          slug: string
          subscription_tier: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          billing_plan?: string
          billing_status?: string
          business_category?: string | null
          created_at?: string
          created_by?: string | null
          default_brand_id?: string | null
          default_locale?: string
          id?: string
          logo_url?: string | null
          name: string
          onboarding_status?: string
          org_type?: string | null
          owner_id: string
          settings?: Json
          slug: string
          subscription_tier?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          billing_plan?: string
          billing_status?: string
          business_category?: string | null
          created_at?: string
          created_by?: string | null
          default_brand_id?: string | null
          default_locale?: string
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_status?: string
          org_type?: string | null
          owner_id?: string
          settings?: Json
          slug?: string
          subscription_tier?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_default_brand_id_fkey"
            columns: ["default_brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_account_metrics: {
        Row: {
          collected_at: string
          engagement_rate: number | null
          followers: number | null
          following: number | null
          id: string
          impressions: number | null
          metadata: Json
          organization_id: string
          posts_count: number | null
          reach: number | null
          social_account_id: string
        }
        Insert: {
          collected_at?: string
          engagement_rate?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          impressions?: number | null
          metadata?: Json
          organization_id: string
          posts_count?: number | null
          reach?: number | null
          social_account_id: string
        }
        Update: {
          collected_at?: string
          engagement_rate?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          impressions?: number | null
          metadata?: Json
          organization_id?: string
          posts_count?: number | null
          reach?: number | null
          social_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_account_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_account_metrics_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_account_metrics_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      post_metrics_snapshots: {
        Row: {
          clicks: number
          collected_at: string
          comments: number
          engagement_rate: number | null
          followers_gained: number
          id: string
          impressions: number
          likes: number
          metadata: Json
          organization_id: string
          profile_visits: number
          publication_id: string
          reach: number
          saves: number
          shares: number
          video_views: number
          watch_time_seconds: number
        }
        Insert: {
          clicks?: number
          collected_at?: string
          comments?: number
          engagement_rate?: number | null
          followers_gained?: number
          id?: string
          impressions?: number
          likes?: number
          metadata?: Json
          organization_id: string
          profile_visits?: number
          publication_id: string
          reach?: number
          saves?: number
          shares?: number
          video_views?: number
          watch_time_seconds?: number
        }
        Update: {
          clicks?: number
          collected_at?: string
          comments?: number
          engagement_rate?: number | null
          followers_gained?: number
          id?: string
          impressions?: number
          likes?: number
          metadata?: Json
          organization_id?: string
          profile_visits?: number
          publication_id?: string
          reach?: number
          saves?: number
          shares?: number
          video_views?: number
          watch_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_metrics_snapshots_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "social_post_publications"
            referencedColumns: ["id"]
          },
        ]
      }
      post_variants: {
        Row: {
          ai_notes: string | null
          brand_id: string | null
          caption: string | null
          character_count: number | null
          created_at: string
          description: string | null
          first_comment: string | null
          hashtags: Json
          hook: string | null
          id: string
          media_asset_ids: Json
          metadata: Json
          organization_id: string
          platform: Database["public"]["Enums"]["steward_platform"]
          platform_validation_status: string
          post_id: string
          thumbnail_asset_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          ai_notes?: string | null
          brand_id?: string | null
          caption?: string | null
          character_count?: number | null
          created_at?: string
          description?: string | null
          first_comment?: string | null
          hashtags?: Json
          hook?: string | null
          id?: string
          media_asset_ids?: Json
          metadata?: Json
          organization_id: string
          platform: Database["public"]["Enums"]["steward_platform"]
          platform_validation_status?: string
          post_id: string
          thumbnail_asset_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          ai_notes?: string | null
          brand_id?: string | null
          caption?: string | null
          character_count?: number | null
          created_at?: string
          description?: string | null
          first_comment?: string | null
          hashtags?: Json
          hook?: string | null
          id?: string
          media_asset_ids?: Json
          metadata?: Json
          organization_id?: string
          platform?: Database["public"]["Enums"]["steward_platform"]
          platform_validation_status?: string
          post_id?: string
          thumbnail_asset_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_variants_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_variants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_variants_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_variants_thumbnail_asset_id_fkey"
            columns: ["thumbnail_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_generation_source: string | null
          approval_state: string
          archived_at: string | null
          assigned_to: string | null
          author_id: string
          brand_id: string | null
          campaign_id: string | null
          content: string
          content_pillar_id: string | null
          created_at: string
          cta: string | null
          hashtags: Json | null
          hook: string | null
          id: string
          main_caption: string | null
          media_asset_ids: Json
          media_urls: Json | null
          metadata: Json
          metrics: Json | null
          organization_id: string | null
          platform: string
          published_id: string | null
          published_time: string | null
          recurrence_schedule: Json | null
          scheduled_time: string | null
          status: string
          title: string | null
          topic_id: string | null
          updated_at: string
        }
        Insert: {
          ai_generation_source?: string | null
          approval_state?: string
          archived_at?: string | null
          assigned_to?: string | null
          author_id: string
          brand_id?: string | null
          campaign_id?: string | null
          content: string
          content_pillar_id?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: Json | null
          hook?: string | null
          id?: string
          main_caption?: string | null
          media_asset_ids?: Json
          media_urls?: Json | null
          metadata?: Json
          metrics?: Json | null
          organization_id?: string | null
          platform: string
          published_id?: string | null
          published_time?: string | null
          recurrence_schedule?: Json | null
          scheduled_time?: string | null
          status: string
          title?: string | null
          topic_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_generation_source?: string | null
          approval_state?: string
          archived_at?: string | null
          assigned_to?: string | null
          author_id?: string
          brand_id?: string | null
          campaign_id?: string | null
          content?: string
          content_pillar_id?: string | null
          created_at?: string
          cta?: string | null
          hashtags?: Json | null
          hook?: string | null
          id?: string
          main_caption?: string | null
          media_asset_ids?: Json
          media_urls?: Json | null
          metadata?: Json
          metrics?: Json | null
          organization_id?: string | null
          platform?: string
          published_id?: string | null
          published_time?: string | null
          recurrence_schedule?: Json | null
          scheduled_time?: string | null
          status?: string
          title?: string | null
          topic_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_content_pillar_id_fkey"
            columns: ["content_pillar_id"]
            isOneToOne: false
            referencedRelation: "content_pillars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "content_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      publish_jobs: {
        Row: {
          attempt_count: number
          brand_id: string | null
          completed_at: string | null
          connection_id: string
          created_at: string
          created_by_user_id: string
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          last_attempt_at: string | null
          max_attempts: number
          metadata: Json
          organization_id: string
          platform: string
          platform_post_id: string | null
          platform_response: Json | null
          platform_url: string | null
          post_content: Json
          post_id: string | null
          post_variant_id: string | null
          priority: number
          processed_at: string | null
          published_post_id: string | null
          published_url: string | null
          retry_backoff_ms: number
          scheduled_at: string
          scheduled_for: string | null
          social_account_id: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          brand_id?: string | null
          completed_at?: string | null
          connection_id: string
          created_at?: string
          created_by_user_id: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          last_attempt_at?: string | null
          max_attempts?: number
          metadata?: Json
          organization_id: string
          platform: string
          platform_post_id?: string | null
          platform_response?: Json | null
          platform_url?: string | null
          post_content: Json
          post_id?: string | null
          post_variant_id?: string | null
          priority?: number
          processed_at?: string | null
          published_post_id?: string | null
          published_url?: string | null
          retry_backoff_ms?: number
          scheduled_at: string
          scheduled_for?: string | null
          social_account_id?: string | null
          started_at?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          brand_id?: string | null
          completed_at?: string | null
          connection_id?: string
          created_at?: string
          created_by_user_id?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          last_attempt_at?: string | null
          max_attempts?: number
          metadata?: Json
          organization_id?: string
          platform?: string
          platform_post_id?: string | null
          platform_response?: Json | null
          platform_url?: string | null
          post_content?: Json
          post_id?: string | null
          post_variant_id?: string | null
          priority?: number
          processed_at?: string | null
          published_post_id?: string | null
          published_url?: string | null
          retry_backoff_ms?: number
          scheduled_at?: string
          scheduled_for?: string | null
          social_account_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publish_jobs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_jobs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_jobs_post_variant_id_fkey"
            columns: ["post_variant_id"]
            isOneToOne: false
            referencedRelation: "post_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_jobs_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publish_jobs_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_content_rules: {
        Row: {
          brand_id: string
          content_pillar_id: string | null
          created_at: string
          cron_expression: string | null
          day_of_week: number[] | null
          id: string
          is_active: boolean
          last_run_at: string | null
          metadata: Json
          name: string
          next_run_at: string | null
          organization_id: string
          platform: Database["public"]["Enums"]["steward_platform"] | null
          template_config: Json
          time_of_day: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          content_pillar_id?: string | null
          created_at?: string
          cron_expression?: string | null
          day_of_week?: number[] | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          metadata?: Json
          name: string
          next_run_at?: string | null
          organization_id: string
          platform?: Database["public"]["Enums"]["steward_platform"] | null
          template_config?: Json
          time_of_day?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          content_pillar_id?: string | null
          created_at?: string
          cron_expression?: string | null
          day_of_week?: number[] | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          metadata?: Json
          name?: string
          next_run_at?: string | null
          organization_id?: string
          platform?: Database["public"]["Enums"]["steward_platform"] | null
          template_config?: Json
          time_of_day?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_content_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_content_rules_content_pillar_id_fkey"
            columns: ["content_pillar_id"]
            isOneToOne: false
            referencedRelation: "content_pillars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_content_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_schedules: {
        Row: {
          audience_segment: string | null
          brand_id: string
          created_at: string
          day_of_week: number
          description: string | null
          end_time: string | null
          id: string
          instructor_name: string | null
          is_active: boolean
          location_id: string | null
          metadata: Json
          name: string
          organization_id: string
          schedule_type: string
          slug: string
          start_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          audience_segment?: string | null
          brand_id: string
          created_at?: string
          day_of_week: number
          description?: string | null
          end_time?: string | null
          id?: string
          instructor_name?: string | null
          is_active?: boolean
          location_id?: string | null
          metadata?: Json
          name: string
          organization_id: string
          schedule_type?: string
          slug: string
          start_time: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          audience_segment?: string | null
          brand_id?: string
          created_at?: string
          day_of_week?: number
          description?: string | null
          end_time?: string | null
          id?: string
          instructor_name?: string | null
          is_active?: boolean
          location_id?: string | null
          metadata?: Json
          name?: string
          organization_id?: string
          schedule_type?: string
          slug?: string
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_schedules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "business_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reusable_snippets: {
        Row: {
          brand_id: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          organization_id: string
          slug: string
          snippet_type: string
          tags: Json
          updated_at: string
        }
        Insert: {
          brand_id: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          organization_id: string
          slug: string
          snippet_type: string
          tags?: Json
          updated_at?: string
        }
        Update: {
          brand_id?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          organization_id?: string
          slug?: string
          snippet_type?: string
          tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reusable_snippets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reusable_snippets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          analytics_permissions: Json
          archived_at: string | null
          auth_provider: string | null
          avatar_url: string | null
          brand_id: string
          connection_status: string
          created_at: string
          display_name: string
          follower_count: number | null
          handle: string | null
          id: string
          is_connected: boolean
          last_sync: string | null
          metadata: Json
          oauth_access_token: string | null
          oauth_expires_at: string | null
          oauth_refresh_token: string | null
          organization_id: string
          platform: string
          platform_account_id: string | null
          posting_permissions: Json
          profile_url: string | null
          provider_account_id: string | null
          scopes: Json
          status: string
          token_expires_at: string | null
          token_secret_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          analytics_permissions?: Json
          archived_at?: string | null
          auth_provider?: string | null
          avatar_url?: string | null
          brand_id: string
          connection_status?: string
          created_at?: string
          display_name: string
          follower_count?: number | null
          handle?: string | null
          id?: string
          is_connected?: boolean
          last_sync?: string | null
          metadata?: Json
          oauth_access_token?: string | null
          oauth_expires_at?: string | null
          oauth_refresh_token?: string | null
          organization_id: string
          platform: string
          platform_account_id?: string | null
          posting_permissions?: Json
          profile_url?: string | null
          provider_account_id?: string | null
          scopes?: Json
          status?: string
          token_expires_at?: string | null
          token_secret_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          analytics_permissions?: Json
          archived_at?: string | null
          auth_provider?: string | null
          avatar_url?: string | null
          brand_id?: string
          connection_status?: string
          created_at?: string
          display_name?: string
          follower_count?: number | null
          handle?: string | null
          id?: string
          is_connected?: boolean
          last_sync?: string | null
          metadata?: Json
          oauth_access_token?: string | null
          oauth_expires_at?: string | null
          oauth_refresh_token?: string | null
          organization_id?: string
          platform?: string
          platform_account_id?: string | null
          posting_permissions?: Json
          profile_url?: string | null
          provider_account_id?: string | null
          scopes?: Json
          status?: string
          token_expires_at?: string | null
          token_secret_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_publications: {
        Row: {
          brand_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          platform: Database["public"]["Enums"]["steward_platform"]
          platform_post_id: string | null
          platform_url: string | null
          post_id: string | null
          post_variant_id: string | null
          publish_job_id: string | null
          published_at: string
          social_account_id: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          platform: Database["public"]["Enums"]["steward_platform"]
          platform_post_id?: string | null
          platform_url?: string | null
          post_id?: string | null
          post_variant_id?: string | null
          publish_job_id?: string | null
          published_at?: string
          social_account_id?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          platform?: Database["public"]["Enums"]["steward_platform"]
          platform_post_id?: string | null
          platform_url?: string | null
          post_id?: string | null
          post_variant_id?: string | null
          publish_job_id?: string | null
          published_at?: string
          social_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_post_publications_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_publications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_publications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_publications_post_variant_id_fkey"
            columns: ["post_variant_id"]
            isOneToOne: false
            referencedRelation: "post_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_publications_publish_job_id_fkey"
            columns: ["publish_job_id"]
            isOneToOne: false
            referencedRelation: "publish_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_publications_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_publications_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          event_type: string
          id: string
          payload: Json | null
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json
          organization_id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string | null
          brand_id: string
          created_at: string
          id: string
          is_public: boolean
          metadata: Json
          name: string
          organization_id: string
          photo_asset_id: string | null
          role_title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          brand_id: string
          created_at?: string
          id?: string
          is_public?: boolean
          metadata?: Json
          name: string
          organization_id: string
          photo_asset_id?: string | null
          role_title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          is_public?: boolean
          metadata?: Json
          name?: string
          organization_id?: string
          photo_asset_id?: string | null
          role_title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_photo_asset_id_fkey"
            columns: ["photo_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          brand_id: string
          created_at: string
          id: string
          is_featured: boolean
          metadata: Json
          organization_id: string
          quote: string
          rating: number | null
          updated_at: string
        }
        Insert: {
          author_name: string
          author_role?: string | null
          brand_id: string
          created_at?: string
          id?: string
          is_featured?: boolean
          metadata?: Json
          organization_id: string
          quote: string
          rating?: number | null
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          is_featured?: boolean
          metadata?: Json
          organization_id?: string
          quote?: string
          rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testimonials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      social_accounts_safe: {
        Row: {
          analytics_permissions: Json | null
          archived_at: string | null
          auth_provider: string | null
          avatar_url: string | null
          brand_id: string | null
          connection_status: string | null
          created_at: string | null
          display_name: string | null
          follower_count: number | null
          handle: string | null
          has_tokens: boolean | null
          id: string | null
          is_connected: boolean | null
          last_sync: string | null
          metadata: Json | null
          organization_id: string | null
          platform: string | null
          platform_account_id: string | null
          posting_permissions: Json | null
          profile_url: string | null
          scopes: Json | null
          status: string | null
          token_expires_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          analytics_permissions?: Json | null
          archived_at?: string | null
          auth_provider?: string | null
          avatar_url?: string | null
          brand_id?: string | null
          connection_status?: string | null
          created_at?: string | null
          display_name?: string | null
          follower_count?: number | null
          handle?: string | null
          has_tokens?: never
          id?: string | null
          is_connected?: boolean | null
          last_sync?: string | null
          metadata?: Json | null
          organization_id?: string | null
          platform?: string | null
          platform_account_id?: string | null
          posting_permissions?: Json | null
          profile_url?: string | null
          scopes?: Json | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          analytics_permissions?: Json | null
          archived_at?: string | null
          auth_provider?: string | null
          avatar_url?: string | null
          brand_id?: string | null
          connection_status?: string | null
          created_at?: string | null
          display_name?: string | null
          follower_count?: number | null
          handle?: string | null
          has_tokens?: never
          id?: string | null
          is_connected?: boolean | null
          last_sync?: string | null
          metadata?: Json | null
          organization_id?: string | null
          platform?: string | null
          platform_account_id?: string | null
          posting_permissions?: Json | null
          profile_url?: string | null
          scopes?: Json | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_approve_org_content: { Args: { p_org_id: string }; Returns: boolean }
      can_edit_org_content: { Args: { p_org_id: string }; Returns: boolean }
      can_manage_org_settings: { Args: { p_org_id: string }; Returns: boolean }
      claim_due_publish_jobs: {
        Args: { limit_count?: number }
        Returns: {
          attempt_count: number
          brand_id: string | null
          completed_at: string | null
          connection_id: string
          created_at: string
          created_by_user_id: string
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          last_attempt_at: string | null
          max_attempts: number
          metadata: Json
          organization_id: string
          platform: string
          platform_post_id: string | null
          platform_response: Json | null
          platform_url: string | null
          post_content: Json
          post_id: string | null
          post_variant_id: string | null
          priority: number
          processed_at: string | null
          published_post_id: string | null
          published_url: string | null
          retry_backoff_ms: number
          scheduled_at: string
          scheduled_for: string | null
          social_account_id: string | null
          started_at: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "publish_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_org_role: { Args: { p_org_id: string }; Returns: string }
      has_org_role: {
        Args: { p_org_id: string; p_roles: string[] }
        Returns: boolean
      }
      is_brand_in_user_org: { Args: { p_brand_id: string }; Returns: boolean }
      is_org_member: { Args: { p_org_id: string }; Returns: boolean }
      seed_kinetic_grappling_demo: {
        Args: { p_brand_id: string; p_organization_id: string }
        Returns: undefined
      }
      storage_object_in_user_org: {
        Args: { object_name: string }
        Returns: boolean
      }
    }
    Enums: {
      steward_ai_job_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "canceled"
      steward_ai_job_type:
        | "caption_generation"
        | "content_repurposing"
        | "hashtag_generation"
        | "image_analysis"
        | "video_analysis"
        | "transcription"
        | "scheduling_recommendation"
        | "performance_analysis"
        | "brand_voice_training"
        | "content_scoring"
        | "post_idea_generation"
        | "variant_generation"
      steward_approval_status:
        | "pending"
        | "in_review"
        | "approved"
        | "rejected"
        | "revision_requested"
        | "canceled"
      steward_asset_type:
        | "image"
        | "video"
        | "generated_image"
        | "generated_video"
        | "thumbnail"
        | "raw_footage"
        | "edited_media"
        | "document"
        | "note"
        | "audio"
        | "caption"
        | "transcript"
        | "ai_analysis"
        | "template"
        | "hashtags"
      steward_automation_action_type:
        | "create_draft"
        | "generate_captions"
        | "generate_variants"
        | "schedule_post"
        | "require_approval"
        | "publish_post"
        | "recycle_post"
        | "notify_team"
        | "run_ai_job"
      steward_automation_trigger_type:
        | "schedule_cron"
        | "asset_uploaded"
        | "intake_received"
        | "class_schedule"
        | "event_upcoming"
        | "post_published"
        | "approval_completed"
        | "manual"
      steward_content_intake_source_type:
        | "user_upload"
        | "imported_post"
        | "pasted_caption"
        | "uploaded_video"
        | "uploaded_image"
        | "external_url"
        | "rss_import"
        | "newsletter_import"
        | "content_idea"
        | "ai_draft"
        | "recurring_source"
        | "api_ingest"
      steward_content_intake_status:
        | "new"
        | "processing"
        | "processed"
        | "failed"
        | "archived"
      steward_notification_type:
        | "publish_failed"
        | "content_needs_review"
        | "ai_draft_ready"
        | "account_disconnected"
        | "post_published"
        | "analytics_milestone"
        | "subscription_issue"
        | "approval_requested"
        | "approval_decision"
        | "automation_run"
      steward_organization_role:
        | "owner"
        | "admin"
        | "strategist"
        | "editor"
        | "approver"
        | "viewer"
        | "client"
        | "service"
        | "member"
        | "manager"
        | "publisher"
        | "analyst"
      steward_platform:
        | "facebook"
        | "instagram"
        | "tiktok"
        | "youtube"
        | "linkedin"
        | "x"
        | "threads"
        | "pinterest"
        | "bluesky"
        | "google_business_profile"
        | "reddit"
        | "slack"
        | "notion"
        | "other"
      steward_post_status:
        | "idea"
        | "draft"
        | "generated"
        | "needs_review"
        | "needs_approval"
        | "approved"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "archived"
      steward_publish_job_status:
        | "queued"
        | "locked"
        | "processing"
        | "publishing"
        | "completed"
        | "succeeded"
        | "failed"
        | "retrying"
        | "canceled"
        | "skipped"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      steward_ai_job_status: [
        "queued",
        "running",
        "succeeded",
        "failed",
        "canceled",
      ],
      steward_ai_job_type: [
        "caption_generation",
        "content_repurposing",
        "hashtag_generation",
        "image_analysis",
        "video_analysis",
        "transcription",
        "scheduling_recommendation",
        "performance_analysis",
        "brand_voice_training",
        "content_scoring",
        "post_idea_generation",
        "variant_generation",
      ],
      steward_approval_status: [
        "pending",
        "in_review",
        "approved",
        "rejected",
        "revision_requested",
        "canceled",
      ],
      steward_asset_type: [
        "image",
        "video",
        "generated_image",
        "generated_video",
        "thumbnail",
        "raw_footage",
        "edited_media",
        "document",
        "note",
        "audio",
        "caption",
        "transcript",
        "ai_analysis",
        "template",
        "hashtags",
      ],
      steward_automation_action_type: [
        "create_draft",
        "generate_captions",
        "generate_variants",
        "schedule_post",
        "require_approval",
        "publish_post",
        "recycle_post",
        "notify_team",
        "run_ai_job",
      ],
      steward_automation_trigger_type: [
        "schedule_cron",
        "asset_uploaded",
        "intake_received",
        "class_schedule",
        "event_upcoming",
        "post_published",
        "approval_completed",
        "manual",
      ],
      steward_content_intake_source_type: [
        "user_upload",
        "imported_post",
        "pasted_caption",
        "uploaded_video",
        "uploaded_image",
        "external_url",
        "rss_import",
        "newsletter_import",
        "content_idea",
        "ai_draft",
        "recurring_source",
        "api_ingest",
      ],
      steward_content_intake_status: [
        "new",
        "processing",
        "processed",
        "failed",
        "archived",
      ],
      steward_notification_type: [
        "publish_failed",
        "content_needs_review",
        "ai_draft_ready",
        "account_disconnected",
        "post_published",
        "analytics_milestone",
        "subscription_issue",
        "approval_requested",
        "approval_decision",
        "automation_run",
      ],
      steward_organization_role: [
        "owner",
        "admin",
        "strategist",
        "editor",
        "approver",
        "viewer",
        "client",
        "service",
        "member",
        "manager",
        "publisher",
        "analyst",
      ],
      steward_platform: [
        "facebook",
        "instagram",
        "tiktok",
        "youtube",
        "linkedin",
        "x",
        "threads",
        "pinterest",
        "bluesky",
        "google_business_profile",
        "reddit",
        "slack",
        "notion",
        "other",
      ],
      steward_post_status: [
        "idea",
        "draft",
        "generated",
        "needs_review",
        "needs_approval",
        "approved",
        "scheduled",
        "publishing",
        "published",
        "failed",
        "archived",
      ],
      steward_publish_job_status: [
        "queued",
        "locked",
        "processing",
        "publishing",
        "completed",
        "succeeded",
        "failed",
        "retrying",
        "canceled",
        "skipped",
      ],
    },
  },
} as const
