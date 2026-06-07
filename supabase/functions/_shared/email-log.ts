import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

type LogEmailParams = {
  triggerName: string
  recipient: string
  status: 'sent' | 'failed'
  errorMessage?: string | null
  payloadRef?: string | null
}

export const logEmail = async (
  supabase: SupabaseClient,
  params: LogEmailParams,
) => {
  const { error } = await supabase.from('email_logs').insert({
    trigger_name: params.triggerName,
    recipient: params.recipient,
    status: params.status,
    error_message: params.errorMessage ?? null,
    payload_ref: params.payloadRef ?? null,
  })

  if (error) {
    console.error('Failed to write email_logs row:', error.message)
  }
}
