import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';

const PROVIDERS = [
  { name: 'LongCat', url: 'https://api.longcat.chat/openai/v1', model: 'LongCat-Flash-Chat' },
  { name: 'DeepSeek', url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { name: 'Qwen(通义)', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-vl-plus' },
  { name: 'Zhipu(智谱)', url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4v' },
  { name: 'Minimax(稀宇)', url: 'https://api.minimax.chat/v1', model: 'abab6.5-chat' },
  { name: 'Doubao(豆包)', url: 'https://ark.cn-beijing.volces.com/api/v3', model: 'ep-xxxxxx' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1', model: 'gpt-4o' }
];

export default function SettingsScreen({ navigation }) {
  const [baseUrl, setBaseUrl] = useState(PROVIDERS[0].url);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(PROVIDERS[0].model);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

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

  const applyPreset = (preset) => {
    setBaseUrl(preset.url);
    setModel(preset.model);
    Alert.alert('已应用', `已切换至 ${preset.name} 配置，请确保 API 密钥正确。`);
  };

  const fetchModels = async () => {
    if (!apiKey) {
      Alert.alert('提示', '请先输入 API 密钥');
      return;
    }
    setLoading(true);
    setGlobalError('');
    try {
      const endpoint = baseUrl.endsWith('/') ? `${baseUrl}models` : `${baseUrl}/models`;
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.status === 404) {
        setGlobalError('该厂商未开放拉取模型列表接口 (如 LongCat)，这是正常现象，请直接手动填写模型名称即可。');
        return;
      }
      
      const data = await response.json();
      if (data && data.data) {
        const models = data.data.map(m => m.id);
        setAvailableModels(models);
        Alert.alert('成功', `获取到 ${models.length} 个模型`);
      } else {
        throw new Error(data.error?.message || '返回格式不正确');
      }
    } catch (e) {
      setGlobalError('无法获取模型列表: ' + e.message + '\n(如果您在电脑网页预览遇到此错误，通常是因为浏览器跨域限制，请使用安卓手机安装 APK 测试)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        
        <Text style={styles.label}>快捷厂商配置</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {PROVIDERS.map(p => (
            <TouchableOpacity key={p.name} style={styles.presetBtn} onPress={() => applyPreset(p)}>
              <Text style={styles.presetText}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>接口地址 (Base URL)</Text>
        <TextInput 
          style={styles.input}
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder="例如：https://api.longcat.chat/openai/v1"
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
          placeholder="例如：LongCat-Flash-Chat"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={styles.tip}>*如果要使用图片生成，请确保该模型支持多模态(Vision)。豆包需要填写您的 endpoint ID (ep-xxx)。</Text>

        {globalError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{globalError}</Text>
          </View>
        ) : null}

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
            <View style={styles.modelGrid}>
              {availableModels.map(m => (
                <TouchableOpacity key={m} style={styles.modelTag} onPress={() => setModel(m)}>
                  <Text style={styles.modelTagText}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  presetScroll: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  presetBtn: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.sm,
  },
  presetText: {
    color: theme.colors.text,
    fontSize: 12,
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
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  modelTag: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  modelTagText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderColor: theme.colors.error,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
  }
});
