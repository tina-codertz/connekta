import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import {
  User,
  MapPin,
  Bell,
  Shield,
  HelpCircle,
  Mail,
} from 'lucide-react-native';
import { Text } from '@/components/ExpoUI';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/lib/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaScreen } from '@/components/ui/SafeAreaScreen';
import { ProfileCard } from '@/components/settings/ProfileCard';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingRow } from '@/components/settings/SettingRow';
import { EditProfileForm } from '@/components/settings/EditProfileForm';
import { SignOutButton } from '@/components/settings/SignOutButton';

export default function SettingsScreen() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [locationEnabled, setLocationEnabled] = useState(profile?.is_location_enabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingName, setEditingName] = useState(profile?.full_name || '');
  const [editingPhone, setEditingPhone] = useState(profile?.phone || '');

  useEffect(() => {
    if (profile) {
      setEditingName(profile.full_name || '');
      setEditingPhone(profile.phone || '');
      setLocationEnabled(profile.is_location_enabled ?? true);
    }
  }, [profile?.full_name, profile?.phone, profile?.is_location_enabled]);

  const openEditProfile = () => {
    setEditingName(profile?.full_name || '');
    setEditingPhone(profile?.phone || '');
    setShowEditProfile(true);
  };

  const handleToggleLocation = async (value: boolean) => {
    setLocationEnabled(value);
    const { error } = await updateProfile({ is_location_enabled: value });
    if (error) {
      setLocationEnabled(!value);
      Alert.alert('Error', 'Failed to update location settings');
    }
  };

  const handleSaveProfile = async () => {
    const { error } = await updateProfile({
      full_name: editingName.trim(),
      phone: editingPhone.trim() || null,
    });
    if (error) {
      Alert.alert('Error', 'Failed to update profile');
      return;
    }
    setShowEditProfile(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaScreen edges={['top']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Settings" compactTop />

        <View style={styles.profileSection}>
          <ProfileCard profile={profile} user={user} onPress={openEditProfile} />
        </View>

        <SettingsSection title="Account" noTopMargin>
          <SettingRow
            icon={<User size={22} color={Colors.primary[400]} />}
            title="Edit Profile"
            subtitle={profile?.full_name || 'Not set'}
            onPress={openEditProfile}
          />
          <SettingRow
            icon={<Mail size={22} color={Colors.primary[400]} />}
            title="Email"
            subtitle={profile?.email || 'Not set'}
            isLast
            trailing={
              <View style={styles.verifiedBadge}>
                <Text textStyle={styles.verifiedText}>Verified</Text>
              </View>
            }
          />
        </SettingsSection>

        <SettingsSection title="Privacy">
          <SettingRow
            icon={<MapPin size={22} color={Colors.secondary[500]} />}
            title="Location Sharing"
            subtitle="Share your location with circles"
            trailing={
              <Switch
                value={locationEnabled}
                onValueChange={handleToggleLocation}
                trackColor={{ false: Colors.neutral[700], true: Colors.primary[600] }}
                thumbColor={Colors.neutral[0]}
              />
            }
          />
          <SettingRow
            icon={<Shield size={22} color={Colors.secondary[500]} />}
            title="Privacy Settings"
            subtitle="Manage who can see your location"
            isLast
            onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon')}
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingRow
            icon={<Bell size={22} color={Colors.accent[500]} />}
            title="Push Notifications"
            subtitle="Arrivals, departures, and alerts"
            isLast
            trailing={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.neutral[700], true: Colors.primary[600] }}
                thumbColor={Colors.neutral[0]}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Other">
          <SettingRow
            icon={<HelpCircle size={22} color={Colors.neutral[400]} />}
            title="Help & Support"
            isLast
            onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon')}
          />
        </SettingsSection>

        <View style={styles.actions}>
          <SignOutButton onPress={handleSignOut} />
        </View>

        <View style={styles.footer}>
          <Text textStyle={styles.footerText}>LocateMate v1.0.0</Text>
        </View>
      </ScrollView>

      <EditProfileForm
        visible={showEditProfile}
        profile={profile}
        name={editingName}
        phone={editingPhone}
        onNameChange={setEditingName}
        onPhoneChange={setEditingPhone}
        onClose={() => setShowEditProfile(false)}
        onSave={handleSaveProfile}
      />
    </SafeAreaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 24,
  },
  profileSection: {
    marginBottom: 0,
  },
  verifiedBadge: {
    backgroundColor: Colors.secondary[900],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.secondary[500],
    fontWeight: '600',
  },
  actions: {
    marginTop: 0,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: Colors.neutral[600],
  },
});
