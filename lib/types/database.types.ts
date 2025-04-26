export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          base_price: number
          check_in: string
          check_out: string
          cleaning_fee: number | null
          created_at: string
          email: string
          guests: number
          id: string
          name: string
          payment_proof: string | null
          phone: string
          property_id: string
          status: string
          tenant_id: string | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          base_price: number
          check_in: string
          check_out: string
          cleaning_fee?: number | null
          created_at?: string
          email: string
          guests: number
          id?: string
          name: string
          payment_proof?: string | null
          phone: string
          property_id: string
          status?: string
          tenant_id?: string | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          check_in?: string
          check_out?: string
          cleaning_fee?: number | null
          created_at?: string
          email?: string
          guests?: number
          id?: string
          name?: string
          payment_proof?: string | null
          phone?: string
          property_id?: string
          status?: string
          tenant_id?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_dates: {
        Row: {
          id: string
          property_id: string
          date: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          date: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          date?: string
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          bathrooms: number
          bedrooms: number
          created_at: string
          description: string
          features: string[] | null
          guests: number
          id: string
          images: string[] | null
          is_featured: boolean
          location: string
          name: string
          price: number
          property_type: string
          updated_at: string | null
        }
        Insert: {
          address: string
          bathrooms: number
          bedrooms: number
          created_at?: string
          description: string
          features?: string[] | null
          guests: number
          id?: string
          images?: string[] | null
          is_featured?: boolean
          location: string
          name: string
          price: number
          property_type: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          description?: string
          features?: string[] | null
          guests?: number
          id?: string
          images?: string[] | null
          is_featured?: boolean
          location?: string
          name?: string
          price?: number
          property_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
