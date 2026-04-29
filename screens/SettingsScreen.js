import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { PROVIDER_PRESETS } from '../constants/providerPresets';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }) {
  const [configs, setConfigs] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const savedProvidersStr = await AsyncStorage.getItem('@providers_config');
      const savedProviders = savedProvidersStr ? JSON.parse(savedProvidersStr) : [];
      setConfigs(savedProviders);

      const activeStr = await AsyncStorage.getItem('@active_config');
      if (activeStr) {
        setActiveConfig(JSON.parse(activeStr));
      } else {
        // 默认激活内置模型
        setActiveConfig({ providerId: 'hawk-builtin', model: 'gemma-4-31b-it' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getProviderStatus = (presetId) => {
    if (presetId === 'hawk-builtin') return 'built-in';
    const config = configs.find(c => c.id === presetId);
    return config && config.apiKey ? 'configured' : 'empty';
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <Text style={styles.sectionTitle}>当前活跃</Text>
        {activeConfig && (
          <View style={styles.activeCard}>
            <View style={styles.activeInfo}>
              <Text style={styles.activeLabel}>
                {PROVIDER_PRESETS.find(p => p.id === activeConfig.providerId)?.emoji || '🤖'} {activeConfig.providerId}
              </Text>
              <Text style={styles.activeModel}>{activeConfig.model}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
          </View>
        )}

        <Text style={styles.sectionTitle}>所有提供商</Text>
        {PROVIDER_PRESETS.map(preset => {
          const status = getProviderStatus(preset.id);
          const isActive = activeConfig?.providerId === preset.id;
          
          return (
            <TouchableOpacity 
              key={preset.id} 
              style={[styles.providerItem, isActive && styles.activeProviderItem]}
              onPress={() => navigation.navigate('ProviderDetail', { providerTemplate: preset })}
            >
              <View style={styles.providerLeft}>
                <Text style={styles.providerEmoji}>{preset.emoji}</Text>
                <View>
                  <Text style={styles.providerName}>{preset.name}</Text>
                  <Text style={styles.providerNote} numberOfLines={1}>{preset.note}</Text>
                </View>
              </View>
              
              <View style={styles.providerRight}>
                {status === 'configured' && <View style={styles.statusDot} />}
                {status === 'built-in' && <Text style={styles.builtinTag}>内置</Text>}
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { padding: theme.spacing.md },
  sectionTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: theme.spacing.sm, marginTop: theme.spacing.md, letterSpacing: 1 },
  activeCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  activeInfo: { flex: 1 },
  activeLabel: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' },
  activeModel: { color: theme.colors.text, fontSize: 12, marginTop: 4 },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  activeProviderItem: { borderColor: theme.colors.primary },
  providerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  providerEmoji: { fontSize: 24, marginRight: theme.spacing.sm },
  providerName: { color: theme.colors.text, fontSize: 16, fontWeight: '500' },
  providerNote: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 },
  providerRight: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 },
  builtinTag: { backgroundColor: theme.colors.border, color: theme.colors.textSecondary, fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 }
});
