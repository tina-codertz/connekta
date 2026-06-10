import { Platform } from 'react-native';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts';
import { Fields, getContactsAsync, SortTypes } from 'expo-contacts/legacy';
import { phoneDigitsOnly } from '@/lib/app-invite';

export interface DeviceContact {
  id: string;
  name: string;
  emails: string[];
  phones: string[];
}

const CONTACTS_PAGE_SIZE = 250;

function mapLegacyContact(contact: {
  id?: string;
  name?: string;
  emails?: { email?: string }[];
  phoneNumbers?: { number?: string }[];
}): DeviceContact | null {
  const emails = (contact.emails ?? [])
    .map((entry) => entry.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email));

  const phones = (contact.phoneNumbers ?? [])
    .map((entry) => entry.number?.trim())
    .filter((phone): phone is string => Boolean(phone));

  if (!emails.length && !phones.length) {
    return null;
  }

  return {
    id: contact.id ?? `${contact.name}-${emails[0] ?? phones[0]}`,
    name: contact.name?.trim() || emails[0] || phones[0] || 'Contact',
    emails,
    phones,
  };
}

async function fetchAllDeviceContacts(): Promise<DeviceContact[]> {
  const contacts: DeviceContact[] = [];
  let pageOffset = 0;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await getContactsAsync({
      fields: [Fields.Emails, Fields.Name, Fields.PhoneNumbers],
      sort: SortTypes.FirstName,
      pageSize: CONTACTS_PAGE_SIZE,
      pageOffset,
    });

    for (const contact of page.data) {
      const mapped = mapLegacyContact(contact);
      if (mapped) {
        contacts.push(mapped);
      }
    }

    hasNextPage = page.hasNextPage;
    pageOffset += CONTACTS_PAGE_SIZE;

    if (!page.data.length) {
      break;
    }
  }

  return contacts;
}

export async function loadDeviceContacts(): Promise<{
  contacts: DeviceContact[];
  error: string | null;
}> {
  if (Platform.OS === 'web') {
    return {
      contacts: [],
      error: 'Contact access is only available on iOS and Android.',
    };
  }

  try {
    const existing = await getPermissionsAsync();
    const permission =
      existing.status === 'granted'
        ? existing
        : await requestPermissionsAsync();

    if (permission.status !== 'granted') {
      return {
        contacts: [],
        error: 'Contact permission is required to find friends from your contacts.',
      };
    }

    if (permission.accessPrivileges === 'none') {
      return {
        contacts: [],
        error: 'LocateMate does not have access to any contacts. Enable access in Settings.',
      };
    }

    const contacts = await fetchAllDeviceContacts();

    return { contacts, error: null };
  } catch (error) {
    console.warn('Failed to load device contacts:', error);
    return {
      contacts: [],
      error:
        error instanceof Error
          ? error.message
          : 'Failed to load contacts. Try again or check app permissions in Settings.',
    };
  }
}

export function filterDeviceContacts(contacts: DeviceContact[], query: string): DeviceContact[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return contacts;
  }

  return contacts.filter((contact) => {
    if (contact.name.toLowerCase().includes(trimmed)) {
      return true;
    }

    if (contact.emails.some((email) => email.includes(trimmed))) {
      return true;
    }

    return contact.phones.some((phone) => {
      const digits = phoneDigitsOnly(phone);
      const queryDigits = phoneDigitsOnly(trimmed);
      return phone.toLowerCase().includes(trimmed) || (queryDigits && digits.includes(queryDigits));
    });
  });
}
