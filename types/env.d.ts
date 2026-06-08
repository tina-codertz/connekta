declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
    EXPO_PUBLIC_MAPBOX_TOKEN?: string;
    EXPO_PUBLIC_MAP_PROVIDER?: string;
    MAPBOX_DOWNLOADS_TOKEN?: string;
  }
}
