export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          user_id: string
          doctor_name: string
          specialty: string
          date: string
          time: string
          notes: string | null
          reminder_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          doctor_name: string
          specialty: string
          date: string
          time: string
          notes?: string | null
          reminder_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          doctor_name?: string
          specialty?: string
          date?: string
          time?: string
          notes?: string | null
          reminder_sent?: boolean
          created_at?: string
        }
      }
    }
  }
}
