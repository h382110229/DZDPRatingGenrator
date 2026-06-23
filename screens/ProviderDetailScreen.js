import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProviderDetailScreen({ route, navigation }) {
  const { providerTemplate } = route.params;
  
  const [baseUrl, setBaseUrl] = useState(providerTemplate.baseUrl);
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState(providerTemplate.models);
  const [newModelName, setNewModelName] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    loadProviderData();
  }, []);

  const loadProviderData = async () => {
    try {
      const savedProvidersStr = await AsyncStorage.getItem('@providers_config');
      if (savedProvidersStr) {
        const savedProviders = JSON.parse(savedProvidersStr);
        const saved = savedProviders.find(p => p.id === providerTemplate.id);
        if (saved) {
          setBaseUrl(saved.baseUrl);
          setApiKey(saved.apiKey);
          setModels(saved.models || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveProvider = async (setAsActive = false) => {
    try {
      const savedProvidersStr = await AsyncStorage.getItem('@providers_config');
      let providers = savedProvidersStr ? JSON.parse(savedProvidersStr) : [];
      
      const newConfig = {
        ...providerTemplate,
        baseUrl,
        apiKey,
        models
      };

      const index = providers.findIndex(p => p.id === providerTemplate.id);
      if (index > -1) {
        providers[index] = newConfig;
      } else {
        providers.push(newConfig);
      }

      await AsyncStorage.setItem('@providers_config', JSON.stringify(providers));

      if (setAsActive) {
        if (models.length === 0 && !providerTemplate.isBuiltin) {
          Alert.alert('提示', '请先添加至少一个模型名称');
          return;
        }
        const activeConfig = {
          providerId: providerTemplate.id,
          model: models[0] || providerTemplate.models[0]
        };
        await AsyncStorage.setItem('@active_config', JSON.stringify(activeConfig));
        // Simplified feedback as per audit (toast replacement would require a library, using Alert for now but less intrusive)
      }
      
      navigation.goBack();
    } catch (e) {
      Alert.alert('错误', '保存失败');
    }
  };

  const fetchModels = async () => {
    if (!apiKey && !providerTemplate.isBuiltin) {
      Alert.alert('提示', '请先输入 API 密钥');
      return;
    }
    setFetching(true);
    try {
      const endpoint = baseUrl.endsWith('/') ? `${baseUrl}models` : `${baseUrl}/models`;
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      if (data && data.data) {
        const remoteModels = data.data.map(m => m.id);
        setModels(prev => [...new Set([...prev, ...remoteModels])]);
      } else {
        throw new Error(data.error?.message || '不支持自动获取列表');
      }
    } catch (e) {
      // Avoid leaking sensitive info as per audit
      Alert.alert('获取失败', '无法自动获取列表，建议手动输入模型名称。');
    } finally {
      setFetching(false);
    }
  };

  const addModel = () => {
    if (!newModelName.trim()) return;
    if (!models.includes(newModelName.trim())) {
      setModels([...models, newModelName.trim()]);
    }
    setNewModelName('');
  };

  const removeModel = (m) => {
    setModels(models.filter(item => item !== m));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header} accessibilityRole="header">
        <Text style={styles.emoji} accessibilityElementsHidden={true}>{providerTemplate.emoji}</Text>
        <Text style={styles.title}>{providerTemplate.name}</Text>
      </View>

      <Text style={styles.note}>{providerTemplate.note}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>API 密钥</Text>
        {providerTemplate.isBuiltin ? (
          <View style={styles.disabledInput}>
            <Text style={styles.disabledText}>内置模型无需密钥</Text>
          </View>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showKey}
              placeholder="sk-…"
              placeholderTextColor={theme.colors.textSecondary}
              autoCorrect={false}
              accessibilityLabel="API 密钥输入框"
            />
            <TouchableOpacity
              onPress={() => setShowKey(!showKey)}
              style={styles.iconBtn}
              accessibilityLabel={showKey ? "隐藏密钥" : "显示密钥"}
              accessibilityRole="button"
            >
              <Ionicons name={showKey ? "eye-off" : "eye"} size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.label, { marginTop: 20 }]}>接口地址 (Base URL)</Text>
        <TextInput
          style={[styles.input, providerTemplate.isBuiltin && styles.disabledInput]}
          value={baseUrl}
          onChangeText={setBaseUrl}
          editable={!providerTemplate.isBuiltin}
          placeholder="https://…"
          placeholderTextColor={theme.colors.textSecondary}
          autoCorrect={false}
          accessibilityLabel="接口地址输入框"
        />

        <View style={styles.modelHeader}>
          <Text style={styles.label}>模型列表</Text>
          {!providerTemplate.isBuiltin && (
            <TouchableOpacity
              onPress={fetchModels}
              disabled={fetching}
              accessibilityLabel="自动获取模型列表"
              accessibilityRole="button"
              accessibilityState={{ disabled: fetching }}
            >
              {fetching ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Text style={styles.linkText}>自动获取</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.modelList}>
          {models.map(m => (
            <View key={m} style={styles.modelTag}>
              <Text style={styles.modelTagText}>{m}</Text>
              {!providerTemplate.isBuiltin && (
                <TouchableOpacity
                  onPress={() => removeModel(m)}
                  accessibilityLabel={`移除模型 ${m}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={16} color={theme.colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {!providerTemplate.isBuiltin && (
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={newModelName}
              onChangeText={setNewModelName}
              placeholder="手动输入模型名…"
              placeholderTextColor={theme.colors.textSecondary}
              autoCorrect={false}
              accessibilityLabel="手动输入模型名称"
            />
            <TouchableOpacity
              onPress={addModel}
              style={styles.iconBtn}
              accessibilityLabel="添加模型"
              accessibilityRole="button"
            >
              <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => saveProvider(true)}
        accessibilityLabel="保存配置并设为当前使用"
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonText}>设为当前使用</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => saveProvider(false)}
        accessibilityLabel="仅保存配置"
        accessibilityRole="button"
      >
        <Text style={styles.secondaryButtonText}>仅保存</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.md, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  emoji: { fontSize: 32, marginRight: theme.spacing.sm },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text },
  note: { color: theme.colors.textSecondary, marginBottom: theme.spacing.lg, lineHeight: 22 },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg
  },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: theme.spacing.xs },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    fontSize: 15
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingRight: theme.spacing.sm
  },
  disabledInput: {
    backgroundColor: theme.colors.surfaceHover,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm
  },
  disabledText: { color: theme.colors.textSecondary },
  iconBtn: { padding: theme.spacing.sm },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: theme.spacing.sm
  },
  linkText: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' },
  modelList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.md },
  modelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHover,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  modelTagText: { color: theme.colors.text, fontSize: 13, marginRight: 6 },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md
  },
  primaryButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  secondaryButtonText: { color: theme.colors.text, fontWeight: 'bold', fontSize: 16 }
});
