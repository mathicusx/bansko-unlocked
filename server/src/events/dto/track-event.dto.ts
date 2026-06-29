/**
 * Payload sent from the browser PixelService to /events/meta.
 * The browser sends *plain-text* user_data; the server hashes it before
 * forwarding to Meta. Never trust the client to hash correctly.
 */
export interface TrackEventDto {
  event_name: string;
  event_id: string;
  event_source_url: string;
  /** Always 'website' for now — add 'app' / 'crm' if/when those channels exist. */
  action_source: 'website' | 'app' | 'crm' | 'email' | 'phone_call' | 'chat';
  event_time: number;
  user_data: Record<string, string>;
  custom_data: Record<string, unknown>;
}
