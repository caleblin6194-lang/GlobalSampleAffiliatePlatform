export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: Database["public"]["Enums"]["role"] | null
          avatar_url: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: Database["public"]["Enums"]["role"] | null
          avatar_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: Database["public"]["Enums"]["role"] | null
          avatar_url?: string | null
          created_at?: string | null
        }
      }
      brands: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          description: string | null
          logo_url: string | null
          website: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          name: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string | null
          name?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          created_at?: string | null
        }
      }
      creator_channels: {
        Row: {
          id: string
          creator_id: string | null
          platform: string
          handle: string
          followers: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          creator_id?: string | null
          platform: string
          handle: string
          followers?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          creator_id?: string | null
          platform?: string
          handle?: string
          followers?: number | null
          created_at?: string | null
        }
      }
      vendors: {
        Row: {
          id: string
          user_id: string | null
          vendor_name: string
          market_code: string
          stall_no: string
          contact_whatsapp: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          vendor_name: string
          market_code: string
          stall_no: string
          contact_whatsapp?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          vendor_name?: string
          market_code?: string
          stall_no?: string
          contact_whatsapp?: string | null
          created_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          merchant_id: string | null
          vendor_id: string | null
          title: string
          description: string | null
          image_url: string | null
          category: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          merchant_id?: string | null
          vendor_id?: string | null
          title: string
          description?: string | null
          image_url?: string | null
          category?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          merchant_id?: string | null
          vendor_id?: string | null
          title?: string
          description?: string | null
          image_url?: string | null
          category?: string | null
          status?: string | null
          created_at?: string | null
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string | null
          model: string
          color: string
          series: string
          barcode_code: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          model: string
          color: string
          series: string
          barcode_code?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string | null
          model?: string
          color?: string
          series?: string
          barcode_code?: string | null
          created_at?: string | null
        }
      }
      campaigns: {
        Row: {
          id: string
          merchant_id: string | null
          product_id: string | null
          title: string
          description: string | null
          sample_qty: number | null
          commission_rate: number | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          merchant_id?: string | null
          product_id?: string | null
          title: string
          description?: string | null
          sample_qty?: number | null
          commission_rate?: number | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          merchant_id?: string | null
          product_id?: string | null
          title?: string
          description?: string | null
          sample_qty?: number | null
          commission_rate?: number | null
          status?: string | null
          created_at?: string | null
        }
      }
      campaign_applications: {
        Row: {
          id: string
          campaign_id: string | null
          creator_id: string | null
          shipping_name: string | null
          phone: string | null
          country: string | null
          state: string | null
          city: string | null
          address_line1: string | null
          address_line2: string | null
          postal_code: string | null
          notes: string | null
          selected_platform: string | null
          status: string | null
          rejection_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          creator_id?: string | null
          shipping_name: string
          phone: string
          country: string
          state: string
          city: string
          address_line1: string
          postal_code: string
          notes?: string | null
          selected_platform: string
          status?: string
          rejection_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          shipping_name?: string | null
          phone?: string | null
          country?: string | null
          state?: string | null
          city?: string | null
          address_line1?: string | null
          address_line2?: string | null
          postal_code?: string | null
          notes?: string | null
          selected_platform?: string | null
          status?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
        }
      }
      creator_tasks: {
        Row: {
          id: string
          application_id: string | null
          campaign_id: string | null
          creator_id: string | null
          merchant_id: string | null
          title: string
          description: string | null
          status: string | null
          due_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          application_id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          merchant_id?: string | null
          title: string
          description?: string | null
          status?: string
          due_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          application_id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          merchant_id?: string | null
          title?: string | null
          description?: string | null
          status?: string | null
          due_at?: string | null
          updated_at?: string | null
        }
      }
      creator_contents: {
        Row: {
          id: string
          task_id: string | null
          creator_id: string | null
          campaign_id: string | null
          platform: string
          content_url: string
          content_title: string | null
          content_description: string | null
          posted_at: string | null
          disclosure_checked: boolean | null
          screenshot_url: string | null
          status: string | null
          rejection_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          task_id?: string | null
          creator_id?: string | null
          campaign_id?: string | null
          platform: string
          content_url: string
          content_title?: string | null
          content_description?: string | null
          posted_at?: string | null
          disclosure_checked?: boolean | null
          screenshot_url?: string | null
          status?: string
          rejection_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          task_id?: string | null
          creator_id?: string | null
          campaign_id?: string | null
          platform?: string
          content_url?: string
          content_title?: string | null
          content_description?: string | null
          posted_at?: string | null
          disclosure_checked?: boolean | null
          screenshot_url?: string | null
          status?: string | null
          rejection_reason?: string | null
          updated_at?: string | null
        }
      }
      // ========== ROUND 4 ==========
      affiliate_links: {
        Row: {
          id: string
          creator_id: string | null
          campaign_id: string | null
          code: string
          target_path: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          creator_id?: string | null
          campaign_id?: string | null
          code: string
          target_path?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          creator_id?: string | null
          campaign_id?: string | null
          code?: string
          target_path?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      coupon_codes: {
        Row: {
          id: string
          creator_id: string | null
          campaign_id: string | null
          code: string
          discount_type: string | null
          discount_value: number | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          creator_id?: string | null
          campaign_id?: string | null
          code: string
          discount_type?: string | null
          discount_value?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          creator_id?: string | null
          campaign_id?: string | null
          code?: string
          discount_type?: string | null
          discount_value?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      clicks: {
        Row: {
          id: string
          affiliate_link_id: string | null
          creator_id: string | null
          campaign_id: string | null
          visitor_id: string | null
          referrer: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          affiliate_link_id?: string | null
          creator_id?: string | null
          campaign_id?: string | null
          visitor_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          affiliate_link_id?: string | null
          creator_id?: string | null
          campaign_id?: string | null
          visitor_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          campaign_id: string | null
          creator_id: string | null
          affiliate_link_id: string | null
          coupon_code_id: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          amount: number | null
          status: string | null
          attribution_source: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          creator_id?: string | null
          affiliate_link_id?: string | null
          coupon_code_id?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          amount?: number | null
          status?: string
          attribution_source?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          campaign_id?: string | null
          creator_id?: string | null
          affiliate_link_id?: string | null
          coupon_code_id?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          amount?: number | null
          status?: string | null
          attribution_source?: string | null
          notes?: string | null
          updated_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          variant_id: string | null
          qty: number | null
          unit_price: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          variant_id?: string | null
          qty?: number | null
          unit_price?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          order_id?: string | null
          product_id?: string | null
          variant_id?: string | null
          qty?: number | null
          unit_price?: number | null
          created_at?: string | null
        }
      }
      commissions: {
        Row: {
          id: string
          order_id: string | null
          creator_id: string | null
          campaign_id: string | null
          amount: number | null
          rate: number | null
          status: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          creator_id?: string | null
          campaign_id?: string | null
          amount?: number | null
          rate?: number | null
          status?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          order_id?: string | null
          creator_id?: string | null
          campaign_id?: string | null
          amount?: number | null
          rate?: number | null
          status?: string | null
          notes?: string | null
          updated_at?: string | null
        }
      }
    }
    Enums: {
      role: "admin" | "merchant" | "creator" | "vendor"
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName]
  : Database["public"]["Tables"][PublicTableNameOrOptions]

export type InsertOf<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type UpdateOf<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
