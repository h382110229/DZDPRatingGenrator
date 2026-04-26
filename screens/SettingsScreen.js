import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';

const DEFAULT_BASE_URL = 'https://api.longcat.chat/openai'; // Standard OpenAI compat

export default function SettingsScreen({ navigation }) {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('LongCat-Flash-Omni-2603'); // Default to vision model
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedBaseUrl = await AsyncStorage.getItem('@baseUrl');
      const savedApiKey = await AsyncStorage.getItem('@apiKey');
      const savedModel = await AsyncStorage.getItem('@model');
      
      if (savedBaseUrl) setBaseUrl(savedBaseUrl);
      if (savedApiKey) setApiKey(savedApiKey);
      if (savedModel) setModel(savedModel);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('@baseUrl', baseUrl);
      await AsyncStorage.setItem('@apiKey', apiKey);
      await AsyncStorage.setItem('@model', model);
      Alert.alert('成功', '设置已保存');
    } catch (e) {
      Alert.alert('错误', '保存设置失败');
    }
  };

  const fetchModels = async () => {
    if (!apiKey) {
      Alert.alert('提示', '请先输入 API 密钥');
      return;
    }
    setLoading(true);
    try {
      const endpoint = baseUrl.endsWith('/') ? `${baseUrl}models` : `${baseUrl}/models`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      const data = await response.json();
      if (data && data.data) {
        const models = data.data.map(m => m.id);
        setAvailableModels(models);
        Alert.alert('成功', `获取到 ${models.length} 个模型`);
      } else {
        throw new Error('返回格式不正确');
      }
    } catch (e) {
      Alert.alert('错误', '无法获取模型列表，请检查地址或网络');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>接口地址 (Base URL)</Text>
        <TextInput 
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="例如：https://api.longcat.chat/openai"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>API 密钥 (API Key)</Text>
        <TextInput 
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry
          placeholder="sk-..."
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>当前模型 (Model)</Text>
        <TextInput 
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="例如：LongCat-Flash-Omni-2603"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={styles.tip}>*如果要使用图片生成，必须选择支持多模态(Vision)的模型</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={fetchModels}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={theme.colors.text} size="small" /> : <Text style={styles.buttonText}>获取可用模型</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={saveSettings}>
            <Text style={styles.primaryButtonText}>保存配置</Text>
          </TouchableOpacity>
        </View>

        {availableModels.length > 0 && (
          <View style={styles.modelsContainer}>
            <Text style={styles.label}>点击下方模型快速选择：</Text>
            {availableModels.map(m => (
              <TouchableOpacity key={m} style={styles.modelTag} onPress={() => setModel(m)}>
                <Text style={styles.modelTagText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.sm,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tip: {
    color: theme.colors.primary,
    fontSize: 12,
    marginBottom: theme.spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  button: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  modelsContainer: {
    marginTop: theme.spacing.lg,
  },
  modelTag: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  modelTagText: {
    color: theme.colors.textSecondary,
  }
});
