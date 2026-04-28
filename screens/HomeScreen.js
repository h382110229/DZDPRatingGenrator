import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, 
  Image, ActivityIndicator, Alert, Modal, FlatList 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { searchAround, getTips } from '../services/amapService';
import { generateReview } from '../services/llmService';

export default function HomeScreen({ navigation }) {
  // 状态：图片
  const [images, setImages] = useState([]); // { uri, base64 }

  // 状态：商铺
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [poiList, setPoiList] = useState([]);
  const [searchingPoi, setSearchingPoi] = useState(false);
  const [cachedLocation, setCachedLocation] = useState(null);
  const searchTimeoutRef = useRef(null);

  // 状态：评价
  const [userReview, setUserReview] = useState('');
  const [wordCount, setWordCount] = useState('250');

  // 状态：生成结果
  const [generating, setGenerating] = useState(false);
  const [reviewHistory, setReviewHistory] = useState([]); // 替代 resultText
  const [globalError, setGlobalError] = useState(''); // 新增：跨域等网络报错的界面展示

  // ========== 快速获取位置（优先缓存，降级GPS）==========
  const getFastLocation = async () => {
    // 1. 优先使用上次已知位置（毫秒级）
    try {
      const last = await Location.getLastKnownPositionAsync({});
      if (last) return last;
    } catch (_) {}
    // 2. 降级：带超时的 GPS 请求
    return await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('定位超时')), 8000)
      ),
    ]);
  };

  // 初始化获取位置
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '未能获取定位权限，您可以手动搜索商铺。');
        return;
      }
      try {
        const location = await getFastLocation();
        setCachedLocation(location);
      } catch (e) {
        console.log('预获取定位失败（不影响手动搜索）', e);
      }
    })();
  }, []);

  // ========== 图片选择 ==========
  const pickImage = async () => {
    if (images.length >= 9) {
      Alert.alert('提示', '最多只能选择 9 张照片');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 9 - images.length,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      // 在此处进行深度压缩，防止导致 413 Payload Too Large
      const newImages = await Promise.all(result.assets.map(async (asset) => {
        try {
          const manipResult = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 800 } }], // 锁定最大宽度 800px，高度等比缩放
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          return {
            uri: manipResult.uri,
            base64: `data:image/jpeg;base64,${manipResult.base64}`
          };
        } catch (error) {
          console.error("图片压缩失败", error);
          // 如果压缩失败，回退到原始压缩方案（风险：依然可能413）
          return {
            uri: asset.uri,
            base64: `data:image/jpeg;base64,${asset.base64}`
          };
        }
      }));
      setImages(prev => [...prev, ...newImages].slice(0, 9));
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // ========== 商铺搜索 ==========
  const loadNearbyStores = async () => {
    setSearchingPoi(true);
    try {
      let location = cachedLocation;
      if (!location) {
        location = await getFastLocation();
        setCachedLocation(location);
      }
      const pois = await searchAround(location.coords.longitude, location.coords.latitude);
      setPoiList(pois);
    } catch (e) {
      console.error('获取周边商铺失败:', e);
      // 定位失败时静默处理，用户可直接在搜索框手动搜索
      setPoiList([]);
    } finally {
      setSearchingPoi(false);
    }
  };

  const handleFuzzySearch = (text) => {
    setStoreSearchQuery(text);
    
    // 清除上一次的定时器（防抖）
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (!text) {
        if (poiList.length === 0) loadNearbyStores();
        return;
      }
      setSearchingPoi(true);
      try {
        const lon = cachedLocation ? cachedLocation.coords.longitude : null;
        const lat = cachedLocation ? cachedLocation.coords.latitude : null;
        
        const tips = await getTips(text, lon, lat);
        setPoiList(tips);
      } catch (e) {
        setGlobalError('搜索联想失败: ' + (e.message || '未知错误'));
      } finally {
        setSearchingPoi(false);
      }
    }, 400); // 400ms 防抖延迟
  };

  const openStoreModal = () => {
    setStoreModalVisible(true);
    if (poiList.length === 0) {
      loadNearbyStores();
    }
  };

  // ========== 生成评价 ==========
  const handleGenerate = async () => {
    if (!selectedStore && images.length === 0 && !userReview) {
      Alert.alert('提示', '至少提供一点信息（图片、商铺或评价）吧！');
      return;
    }

    setGenerating(true);
    setGlobalError('');

    try {
      const savedBaseUrl = await AsyncStorage.getItem('@baseUrl');
      const savedApiKey = await AsyncStorage.getItem('@apiKey');
      const savedModel = await AsyncStorage.getItem('@model');

      if (!savedApiKey) {
        setGlobalError('请先在右上角设置中配置大模型 API Key');
        setGenerating(false);
        return;
      }

      const config = {
        baseUrl: savedBaseUrl || 'https://api.longcat.chat/openai',
        apiKey: savedApiKey,
        model: savedModel || 'LongCat-Flash-Omni-2603',
      };

      const params = {
        storeName: selectedStore?.name || '',
        userReview: userReview,
        wordCount: wordCount,
        images: images.map(img => img.base64),
      };

      const result = await generateReview(params, config);
      
      // 追加到历史记录的最前面
      setReviewHistory(prev => [{
        id: Date.now().toString(),
        text: result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        store: selectedStore?.name || '未知商铺'
      }, ...prev]);

    } catch (e) {
      setGlobalError('生成失败: ' + e.message + '\n(如果您在电脑网页预览遇到此错误，通常是因为浏览器跨域限制，请使用安卓手机安装 APK 测试)');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('成功', '点评已复制到剪贴板！');
  };

  const handleResetInputs = () => {
    setImages([]);
    setSelectedStore(null);
    setUserReview('');
  };

  // 配置右上角设置按钮
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginRight: theme.spacing.md }}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView style={styles.container}>
      
      {/* 顶部控制栏 */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>准备新点评</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetInputs}>
          <Ionicons name="refresh-outline" size={16} color={theme.colors.error} />
          <Text style={styles.resetBtnText}>一键清空</Text>
        </TouchableOpacity>
      </View>

      {/* 1. 照片上传区 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>上传图片 (最高9张)</Text>
        <View style={styles.imageGrid}>
          {images.map((img, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: img.uri }} style={styles.image} />
              <TouchableOpacity style={styles.deleteBtn} onPress={() => removeImage(index)}>
                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 9 && (
            <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
              <Ionicons name="add" size={32} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. 商铺选择 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商铺信息</Text>
        <TouchableOpacity style={styles.storeSelector} onPress={openStoreModal}>
          <Text style={selectedStore ? styles.storeText : styles.storePlaceholder}>
            {selectedStore ? selectedStore.name : '点击选择或搜索商铺'}
          </Text>
          <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 3. 个人评价 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>简单感受 (选填)</Text>
        <TextInput 
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="有什么特别想夸或吐槽的？比如：服务太棒了、菜品很新鲜...（可留空）"
          placeholderTextColor={theme.colors.textSecondary}
          value={userReview}
          onChangeText={setUserReview}
        />
      </View>

      {/* 4. 字数要求 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>字数要求 (选填)</Text>
        <TextInput 
          style={styles.input}
          placeholder="默认200-300字"
          placeholderTextColor={theme.colors.textSecondary}
          value={wordCount}
          onChangeText={setWordCount}
        />
      </View>

      {/* 界面错误提示 */}
      {globalError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{globalError}</Text>
        </View>
      ) : null}

      {/* 生成按钮 */}
      <TouchableOpacity 
        style={[styles.generateBtn, generating && styles.generateBtnDisabled]} 
        onPress={handleGenerate}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text style={styles.generateBtnText}>一键生成点评 🦅</Text>
        )}
      </TouchableOpacity>

      {/* 结果展示 (多卡片流) */}
      {reviewHistory.length > 0 && (
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>生成记录</Text>
          {reviewHistory.map((item) => (
            <View key={item.id} style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <Text style={styles.resultTime}>{item.timestamp} · {item.store}</Text>
              </View>
              <Text style={styles.resultText}>{item.text}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={() => copyToClipboard(item.text)}>
                <Ionicons name="copy-outline" size={18} color="#000" />
                <Text style={styles.copyBtnText}>复制内容</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* 商铺选择 Modal */}
      <Modal visible={storeModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择商铺</Text>
              <TouchableOpacity onPress={() => setStoreModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchRow}>
              <TextInput 
                style={styles.searchInput}
                placeholder="搜索附近商铺 (支持模糊联想)..."
                placeholderTextColor={theme.colors.textSecondary}
                value={storeSearchQuery}
                onChangeText={handleFuzzySearch}
              />
            </View>

            {searchingPoi ? (
              <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList 
                data={poiList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.poiItem} onPress={() => {
                    setSelectedStore(item);
                    setStoreModalVisible(false);
                  }}>
                    <Text style={styles.poiName}>{item.name}</Text>
                    <Text style={styles.poiAddress}>{item.address || item.type}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>未找到相关商铺</Text>}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  resetBtnText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storePlaceholder: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  storeText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    height: 100,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  generateBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateBtnText: {
    color: '#000000', // Deep black for contrast with Amber/Gold
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultSection: {
    marginBottom: theme.spacing.xl,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  resultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  resultTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  resultText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  copyBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.md,
  },
  copyBtnText: {
    color: '#000',
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  searchBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
  },
  poiItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  poiName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  poiAddress: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: theme.spacing.xs,
  }
});
