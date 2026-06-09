import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl, InteractionManager } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Plus, Users, LogIn } from 'lucide-react-native';
import { Row } from '@/components/ExpoUI';
import { ActionButtonGroup } from '@/components/ui/ActionButtonGroup';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useAuth } from '@/hooks/useAuth';
import { useTabBarInsets } from '@/hooks/useTabBarInsets';
import { supabase } from '@/lib/supabase';
import { joinCircleByCode, mapCircleMembers } from '@/lib/circles';
import { Colors } from '@/lib/theme';
import { ScreenHeader, HeaderActionButton } from '@/components/ui/ScreenHeader';
import { SafeAreaScreen } from '@/components/ui/SafeAreaScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { GradientSubmitButton } from '@/components/ui/GradientSubmitButton';
import { CircleCard } from '@/components/circles/CircleCard';
import { CreateCircleForm } from '@/components/circles/CreateCircleForm';
import { CircleDetailModal } from '@/components/circles/CircleDetailModal';
import { InviteToCircleModal } from '@/components/circles/InviteToCircleModal';
import { JoinCircleForm } from '@/components/circles/JoinCircleForm';
import { CircleWithDetails } from '@/components/circles/types';

export default function CirclesScreen() {
  const { action } = useLocalSearchParams<{ action?: string | string[] }>();
  const { user } = useAuth();
  const { contentPaddingBottom } = useTabBarInsets();
  const [circles, setCircles] = useState<CircleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<CircleWithDetails | null>(null);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showCircleDetail, setShowCircleDetail] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const hasLoadedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        loadCircles(!hasLoadedRef.current);
        hasLoadedRef.current = true;
      });

      return () => task.cancel();
    }, [user?.id])
  );

  useEffect(() => {
    const nextAction = Array.isArray(action) ? action[0] : action;
    if (nextAction === 'create') {
      setShowCreateModal(true);
    }
    if (nextAction === 'join') {
      setShowJoinModal(true);
    }
  }, [action]);

  async function loadCircles(showSpinner = true): Promise<CircleWithDetails[]> {
    if (!user) return [];

    if (showSpinner) {
      setLoading(true);
    }
    const { data: memberData } = await supabase
      .from('circle_members')
      .select('circle_id, role')
      .eq('user_id', user.id);

    if (!memberData || memberData.length === 0) {
      setCircles([]);
      setLoading(false);
      return [];
    }

    const circleIds = memberData.map((m) => m.circle_id);
    const { data: circlesData } = await supabase
      .from('circles')
      .select('*')
      .in('id', circleIds);

    if (!circlesData) {
      setCircles([]);
      setLoading(false);
      return [];
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
          members: mapCircleMembers(members),
          places_count: count || 0,
        };
      })
    );

    setCircles(circlesWithDetails);
    setLoading(false);
    return circlesWithDetails;
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
      Alert.alert('Error', circleError?.message || 'Failed to create circle');
      return;
    }

    const { error: memberError } = await supabase.from('circle_members').insert({
      circle_id: circle.id,
      user_id: user.id,
      role: 'owner',
    });

    if (memberError) {
      Alert.alert('Error', memberError.message || 'Failed to add you to the circle');
      return;
    }

    setShowCreateModal(false);
    setNewCircleName('');
    setNewCircleDescription('');
    await loadCircles();

    setSelectedCircle({
      ...circle,
      members: [],
      places_count: 0,
    });
    setShowInviteModal(true);
  }

  async function handleMemberAdded() {
    const updatedCircles = await loadCircles();
    if (!selectedCircle) {
      return;
    }

    const updated = updatedCircles.find((circle) => circle.id === selectedCircle.id);
    if (updated) {
      setSelectedCircle(updated);
    }
  }

  async function handleJoinCircle() {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setJoining(true);
    const { data, error } = await joinCircleByCode(joinCode);
    setJoining(false);

    if (error || !data) {
      Alert.alert('Error', error?.message || 'Failed to join circle');
      return;
    }

    setShowJoinModal(false);
    setJoinCode('');
    await loadCircles();

    if (data.already_member) {
      Alert.alert('Already a member', `You are already in "${data.circle_name}"`);
    } else {
      Alert.alert('Success', `You joined "${data.circle_name}"`);
    }
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
    <SafeAreaScreen edges={['top']} style={styles.container}>
      <ScreenHeader
        title="Circles"
        compactTop
        action={
          <Row spacing={8}>
            <HeaderActionButton
              onPress={() => setShowJoinModal(true)}
              accessibilityLabel="Join circle"
            >
              <LogIn size={20} color={Colors.neutral[0]} />
            </HeaderActionButton>
            <HeaderActionButton
              onPress={() => setShowCreateModal(true)}
              accessibilityLabel="Create circle"
            >
              <Plus size={24} color={Colors.neutral[0]} />
            </HeaderActionButton>
          </Row>
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
        contentContainerStyle={[styles.listContent, { paddingBottom: contentPaddingBottom }]}
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
              description="Create a circle to share your location, or join one with an invite code."
              action={
                <ActionButtonGroup>
                  <GradientSubmitButton
                    label="Create Circle"
                    onPress={() => setShowCreateModal(true)}
                    icon={<Plus size={20} color={Colors.neutral[0]} />}
                  />
                  <SecondaryButton
                    label="Join Circle"
                    onPress={() => setShowJoinModal(true)}
                    icon={<LogIn size={20} color={Colors.neutral[0]} />}
                  />
                </ActionButtonGroup>
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

      <JoinCircleForm
        visible={showJoinModal}
        code={joinCode}
        onCodeChange={setJoinCode}
        onClose={() => setShowJoinModal(false)}
        onSubmit={handleJoinCircle}
        loading={joining}
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

      <InviteToCircleModal
        visible={showInviteModal}
        circle={selectedCircle}
        userId={user?.id || ''}
        onClose={() => setShowInviteModal(false)}
        onMemberAdded={handleMemberAdded}
      />
    </SafeAreaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
  },
});
