import { Platform } from 'react-native';
import * as Contacts from 'expo-contacts';

export interface DeviceContact {
  id: string;
  name: string;
  emails: string[];
  phones: string[];
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

  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') {
    return {
      contacts: [],
      error: 'Contact permission is required to find friends from your contacts.',
    };
  }

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Emails, Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
    sort: Contacts.SortTypes.FirstName,
  });

  const contacts: DeviceContact[] = [];

  for (const contact of data) {
    const emails = (contact.emails ?? [])
      .map((entry) => entry.email?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email));

    const phones = (contact.phoneNumbers ?? [])
      .map((entry) => entry.number?.trim())
      .filter((phone): phone is string => Boolean(phone));

    if (!emails.length && !phones.length) {
      continue;
    }

    contacts.push({
      id: contact.id ?? `${contact.name}-${emails[0] ?? phones[0]}`,
      name: contact.name?.trim() || emails[0] || phones[0] || 'Contact',
      emails,
      phones,
    });
  }

  return { contacts, error: null };
}
