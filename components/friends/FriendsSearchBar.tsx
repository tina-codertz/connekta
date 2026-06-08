import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Colors } from '@/lib/theme';

interface FriendsSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export function FriendsSearchBar({ value, onChangeText, onClear }: FriendsSearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Search size={20} color={Colors.neutral[500]} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Search by email or name"
          placeholderTextColor={Colors.neutral[500]}
          value={value}
          onChangeText={onChangeText}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear}>
            <X size={18} color={Colors.neutral[500]} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[800],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    paddingHorizontal: 16,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    color: Colors.neutral[0],
    fontSize: 16,
    paddingVertical: 16,
    fontFamily: 'Inter-Regular',
  },
});
