import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Plus, Users } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/theme';
import { ScreenHeader, HeaderActionButton } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { GradientSubmitButton } from '@/components/ui/GradientSubmitButton';
import { CircleCard } from '@/components/circles/CircleCard';
import { CreateCircleForm } from '@/components/circles/CreateCircleForm';
import { CircleDetailModal } from '@/components/circles/CircleDetailModal';
import { InviteMemberForm } from '@/components/circles/InviteMemberForm';
import { CircleWithDetails } from '@/components/circles/types';

export default function CirclesScreen() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<CircleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<CircleWithDetails | null>(null);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showCircleDetail, setShowCircleDetail] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadCircles();
  }, []);

  async function loadCircles() {
    if (!user) return;

    setLoading(true);
    const { data: memberData } = await supabase
      .from('circle_members')
      .select('circle_id, role')
      .eq('user_id', user.id);

    if (!memberData || memberData.length === 0) {
      setCircles([]);
      setLoading(false);
      return;
    }

    const circleIds = memberData.map((m) => m.circle_id);
    const { data: circlesData } = await supabase
      .from('circles')
      .select('*')
      .in('id', circleIds);

    if (!circlesData) {
      setCircles([]);
      setLoading(false);
      return;
    }

    const circlesWithDetails: CircleWithDetails[] = await Promise.all(
      circlesData.map(async (circle) => {
        const { data: members } = await supabase
          .from('circle_members')
          .select('*, profiles!inner(*)')
          .eq('circle_id', circle.id);

        const { count } = await supabase
          .from('places')
          .select('*', { count: 'exact', head: true })
          .eq('circle_id', circle.id);

        return {
          ...circle,
          members: members || [],
          places_count: count || 0,
        };
      })
    );

    setCircles(circlesWithDetails);
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCircles();
    setRefreshing(false);
  }, []);

  async function createCircle() {
    if (!user || !newCircleName.trim()) {
      Alert.alert('Error', 'Please enter a circle name');
      return;
    }

    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .insert({
        name: newCircleName.trim(),
        description: newCircleDescription.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (circleError || !circle) {
      Alert.alert('Error', 'Failed to create circle');
      return;
    }

    const { error: memberError } = await supabase.from('circle_members').insert({
      circle_id: circle.id,
      user_id: user.id,
      role: 'owner',
    });

    if (memberError) {
      Alert.alert('Error', 'Failed to add you to the circle');
      return;
    }

    setShowCreateModal(false);
    setNewCircleName('');
    setNewCircleDescription('');
    loadCircles();
  }

  async function inviteMember() {
    if (!selectedCircle || !inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    const { error } = await supabase.from('circle_invitations').insert({
      circle_id: selectedCircle.id,
      inviter_id: user!.id,
      invitee_email: inviteEmail.trim().toLowerCase(),
    });

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Error', 'This person has already been invited');
      } else {
        Alert.alert('Error', 'Failed to send invitation');
      }
      return;
    }

    Alert.alert('Success', 'Invitation sent successfully');
    setShowInviteModal(false);
    setInviteEmail('');
  }

  async function deleteCircle(circleId: string) {
    Alert.alert(
      'Delete Circle',
      'Are you sure you want to delete this circle? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('circles').delete().eq('id', circleId);

            if (error) {
              Alert.alert('Error', 'Failed to delete circle');
              return;
            }

            loadCircles();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Circles"
        action={
          <HeaderActionButton onPress={() => setShowCreateModal(true)}>
            <Plus size={24} color={Colors.neutral[0]} />
          </HeaderActionButton>
        }
      />

      <FlatList
        data={circles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CircleCard
            circle={item}
            onPress={() => {
              setSelectedCircle(item);
              setShowCircleDetail(true);
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon={<Users size={48} color={Colors.neutral[600]} />}
              title="No Circles Yet"
              description="Create a circle to start sharing your location with friends and family"
              action={
                <GradientSubmitButton
                  label="Create Circle"
                  onPress={() => setShowCreateModal(true)}
                  icon={<Plus size={20} color={Colors.neutral[0]} />}
                />
              }
            />
          ) : null
        }
      />

      <CreateCircleForm
        visible={showCreateModal}
        name={newCircleName}
        description={newCircleDescription}
        onNameChange={setNewCircleName}
        onDescriptionChange={setNewCircleDescription}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createCircle}
      />

      <CircleDetailModal
        visible={showCircleDetail}
        circle={selectedCircle}
        onClose={() => setShowCircleDetail(false)}
        onInvite={() => {
          setShowCircleDetail(false);
          setShowInviteModal(true);
        }}
        onDelete={(id) => {
          setShowCircleDetail(false);
          deleteCircle(id);
        }}
      />

      <InviteMemberForm
        visible={showInviteModal}
        email={inviteEmail}
        onEmailChange={setInviteEmail}
        onClose={() => setShowInviteModal(false)}
        onSubmit={inviteMember}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[950],
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
});
