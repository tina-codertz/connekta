import { createClient } from 'npm:@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const PUSH_TYPES = new Set(['sos', 'arrival', 'departure']);

type AlertRecord = {
  id: string;
  circle_id: string;
  user_id: string;
  place_id: string | null;
  type: string;
  message: string | null;
};

type WebhookPayload = {
  type?: string;
  record?: AlertRecord;
};

type ProfileName = {
  full_name: string | null;
  email: string;
};

type CircleMemberRow = {
  user_id: string;
  profiles: {
    expo_push_token: string | null;
  } | null;
};

function getDisplayName(profile: ProfileName | null): string {
  if (!profile) {
    return 'Someone';
  }

  const trimmedName = profile.full_name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  return profile.email.split('@')[0] || 'Someone';
}

function getNotificationContent(
  alert: AlertRecord,
  senderName: string
): { title: string; body: string } {
  switch (alert.type) {
    case 'sos':
      return {
        title: `SOS from ${senderName}`,
        body: alert.message || `${senderName} sent an emergency alert.`,
      };
    case 'arrival':
      return {
        title: `${senderName} arrived`,
        body: alert.message || `${senderName} arrived at a saved place.`,
      };
    case 'departure':
      return {
        title: `${senderName} left a place`,
        body: alert.message || `${senderName} left a saved place.`,
      };
    default:
      return {
        title: 'Circle update',
        body: alert.message || `${senderName} sent an update.`,
      };
  }
}

async function sendExpoPushMessages(
  messages: Record<string, unknown>[]
): Promise<number> {
  let sent = 0;

  for (let index = 0; index < messages.length; index += 100) {
    const chunk = messages.slice(index, index + 100);
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(chunk),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Expo push request failed:', errorText);
      continue;
    }

    sent += chunk.length;
  }

  return sent;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  if (!serviceRoleKey || !supabaseUrl) {
    return new Response('Missing Supabase environment variables', {
      status: 500,
    });
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const alert = payload.record;
  if (!alert?.circle_id || !alert.user_id || !alert.type) {
    return new Response(JSON.stringify({ skipped: true, reason: 'invalid_record' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!PUSH_TYPES.has(alert.type)) {
    return new Response(JSON.stringify({ skipped: true, reason: 'unsupported_type' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: senderProfile, error: senderError } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', alert.user_id)
    .maybeSingle();

  if (senderError) {
    console.error('Failed to load sender profile:', senderError.message);
    return new Response(senderError.message, { status: 500 });
  }

  const { data: members, error: membersError } = await supabase
    .from('circle_members')
    .select('user_id, profiles!inner(expo_push_token)')
    .eq('circle_id', alert.circle_id)
    .neq('user_id', alert.user_id);

  if (membersError) {
    console.error('Failed to load circle members:', membersError.message);
    return new Response(membersError.message, { status: 500 });
  }

  const senderName = getDisplayName(senderProfile);
  const notification = getNotificationContent(alert, senderName);

  const tokens = Array.from(
    new Set(
      ((members as CircleMemberRow[] | null) ?? [])
        .map((member) => member.profiles?.expo_push_token)
        .filter((token): token is string => Boolean(token))
    )
  );

  if (tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: 'no_tokens' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = tokens.map((token) => ({
    to: token,
    title: notification.title,
    body: notification.body,
    sound: alert.type === 'sos' ? 'default' : undefined,
    priority: 'high',
    channelId: 'circle-alerts',
    data: {
      alertId: alert.id,
      type: alert.type,
      circleId: alert.circle_id,
      placeId: alert.place_id,
    },
  }));

  const sent = await sendExpoPushMessages(messages);

  return new Response(JSON.stringify({ sent, tokens: tokens.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
