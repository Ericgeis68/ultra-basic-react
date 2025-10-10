import { supabase } from '@/integrations/supabase/client';

export type BrandingRecord = {
  id: string;
  app_name: string | null;
  logo_url: string | null;
  login_background_url: string | null;
  login_panel_variant: 'default' | 'glass' | 'bordered' | null;
  login_title: string | null;
  updated_at?: string;
};

const BRANDING_TABLE = 'branding_settings';
const BRANDING_ROW_ID = 'default';

export async function fetchBranding(): Promise<BrandingRecord | null> {
  const { data, error } = await supabase
    .from(BRANDING_TABLE)
    .select('*')
    .eq('id', BRANDING_ROW_ID)
    .maybeSingle();
  if (error) {
    console.warn('fetchBranding error:', error);
    return null;
  }
  return data as BrandingRecord | null;
}

export async function upsertBranding(payload: Partial<BrandingRecord>): Promise<void> {
  const toUpsert: BrandingRecord = {
    id: BRANDING_ROW_ID,
    app_name: payload.app_name ?? null,
    logo_url: payload.logo_url ?? null,
    login_background_url: payload.login_background_url ?? null,
    login_panel_variant: payload.login_panel_variant ?? null,
    login_title: payload.login_title ?? null,
    updated_at: undefined,
  };
  const { error } = await supabase
    .from(BRANDING_TABLE)
    .upsert(toUpsert, { onConflict: 'id' });
  if (error) throw error;
}



