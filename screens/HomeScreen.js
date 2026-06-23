import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Image, ActivityIndicator, Alert, Modal, FlatList, Platform, Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { searchAround, getTips } from '../services/amapService';
import { generateReview } from '../services/llmService';
import { getBuiltinConfig } from '../constants/defaults';
import { REVIEW_STYLES } from '../constants/reviewStyles';

const PRESET_TAGS = [
  '味道惊艳', '食材新鲜', '分量充足', '性价比高',
  '环境优雅', '干净卫生', '服务热情', '排队较久',
  '避雷不值', '稍微小贵', '适合聚会', '上菜很快'
];

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
  const scrollViewRef = useRef(null);

  // 状态：风格 & 评价
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [styleModalVisible, setStyleModalVisible] = useState(false);
  const [userReview, setUserReview] = useState('');
  const [wordCount, setWordCount] = useState('200');

  // 新增：打分与标签状态
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);

  // 状态：生成结果与进度
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0); // 0: idle, 1: preprocess, 2: extract, 3: llm
  const [reviewHistory, setReviewHistory] = useState([]); // 替代 resultText
  const [globalError, setGlobalError] = useState(''); // 新增：跨域等网络报错的界面展示

  // 新增：更新检测状态
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // 版本对比函数 (1.3.1 vs 1.3.0)
  const isNewerVersion = (current, latest) => {
    const c = current.split('.').map(Number);
    const l = latest.replace('v', '').split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (l[i] > (c[i] || 0)) return true;
      if (l[i] < (c[i] || 0)) return false;
    }
    return false;
  };

  const checkUpdate = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/h382110229/DZDPRatingGenrator/releases/latest');
      const data = await response.json();
      if (data && data.tag_name) {
        const currentVersion = require('../app.json').expo.version;
        if (isNewerVersion(currentVersion, data.tag_name)) {
          setUpdateInfo(data);
          setShowUpdateModal(true);
        }
      }
    } catch (e) {
      console.log('检查更新失败', e);
    }
  };

  // 加载本地历史记录
  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('@review_history');
      if (savedHistory) {
        setReviewHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error('加载历史记录失败', e);
    }
  };

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

  // 初始化获取位置 & 历史记录
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

    // 加载历史记录
    loadHistory();

    // 检查更新
    checkUpdate();
  }, [navigation]);

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
    setGenerationStep(1);

    try {
      // 触觉反馈开始生成
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      // 阶段 1: 压缩/多模态图片处理 (若有图)
      if (images.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 800)); // 模拟对图片的分析过程展示
      }

      // 阶段 2: 提取商铺与特征
      setGenerationStep(2);
      await new Promise(resolve => setTimeout(resolve, 600)); // 模拟特征预处理展示

      // 阶段 3: AI 生成调用
      setGenerationStep(3);
      const config = getBuiltinConfig();

      const params = {
        storeName: selectedStore?.name || '',
        userReview: userReview,
        wordCount: wordCount,
        images: images.map(img => img.base64),
        style: getEffectiveStyle(),
        rating: rating,
        tags: selectedTags,
      };

      const result = await generateReview(params, config);
      
      // 成功触觉反馈
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      const newCard = {
        id: Date.now().toString(),
        text: result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        store: selectedStore?.name || '自由探店',
        rating: rating,
        tags: selectedTags
      };

      // 追加到历史记录的最前面，并存盘
      setReviewHistory(prev => {
        const updated = [newCard, ...prev].slice(0, 30); // 限制最多30条历史
        AsyncStorage.setItem('@review_history', JSON.stringify(updated)).catch(e => console.error(e));
        return updated;
      });

    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      // 特殊处理内置 AI 的限速报错
      if (e.message && e.message.includes('hawk_error')) {
        try {
          const errData = JSON.parse(e.message);
          setGlobalError(errData.message);
        } catch (_) {
          setGlobalError('生成失败: ' + e.message);
        }
      } else {
        setGlobalError('生成失败: ' + e.message + '\n(如果您在电脑网页预览遇到此错误，通常是因为浏览器跨域限制，请使用安卓手机安装 APK 测试)');
      }
    } finally {
      setGenerating(false);
      setGenerationStep(0);
    }
  };

  const copyAndOpenDianping = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      
      Alert.alert(
        '复制成功 📋',
        '点评内容已复制到剪贴板！是否立即打开大众点评 App 粘贴发布？',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '打开点评', 
            style: 'default',
            onPress: async () => {
              const dpUrl = 'dianping://home';
              try {
                const canOpen = await Linking.canOpenURL(dpUrl);
                if (canOpen) {
                  await Linking.openURL(dpUrl);
                } else {
                  // 尝试备用 scheme
                  const fallbackUrl = 'dianping://';
                  const canOpenFallback = await Linking.canOpenURL(fallbackUrl);
                  if (canOpenFallback) {
                    await Linking.openURL(fallbackUrl);
                  } else {
                    Alert.alert('提示', '未能拉起大众点评，请确认是否安装该 App，或手动打开发布。');
                  }
                }
              } catch (_) {
                Alert.alert('提示', '未能拉起大众点评，请手动打开发布。');
              }
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('错误', '复制失败: ' + e.message);
    }
  };

  const handleResetInputs = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setImages([]);
    setSelectedStore(null);
    setUserReview('');
    setSelectedStyleIndex(0);
    setWordCount('200');
    setRating(5);
    setSelectedTags([]);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // 随机风格时运行时随机抽取真实风格
  const getEffectiveStyle = () => {
    if (selectedStyleIndex === 0) {
      const randIdx = Math.floor(Math.random() * (REVIEW_STYLES.length - 1)) + 1;
      return REVIEW_STYLES[randIdx];
    }
    return REVIEW_STYLES[selectedStyleIndex];
  };

  // 配置右上角 (隐藏设置按钮)
  useEffect(() => {
    navigation.setOptions({
      headerRight: null,
    });
  }, [navigation]);

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      
      {/* 品牌标识 */}
      <View style={styles.brandHeader} accessibilityRole="header">
        <Image
          source={require('../assets/hawk.png')}
          style={styles.brandLogo}
          resizeMode="contain"
          accessibilityElementsHidden={true}
        />
        <Text style={styles.brandText}>HAWK</Text>
        <Text style={styles.brandSub}>AI RATING GEN</Text>
      </View>

      {/* 顶部标题 */}
      <Text style={styles.screenTitle}>准备新点评 ✍️</Text>

      {/* 1. 照片上传区 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>上传图片 (最高9张)</Text>
          <Text style={styles.sectionCount}>{images.length}/9</Text>
        </View>
        <View style={styles.imageGrid}>
          {images.map((img, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: img.uri }} style={styles.image} accessibilityLabel={`已选择图片 ${index + 1}`} />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => removeImage(index)}
                accessibilityLabel="删除图片"
                accessibilityRole="button"
              >
                <Ionicons name="close-circle" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 9 && (
            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={pickImage}
              accessibilityLabel="添加图片"
              accessibilityRole="button"
            >
              <Ionicons name="add" size={32} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. 商店名称 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>商店名称</Text>
        <TouchableOpacity
          style={styles.storeSelector}
          onPress={openStoreModal}
          accessibilityLabel="选择商铺"
          accessibilityRole="button"
          accessibilityHint={selectedStore ? `已选择: ${selectedStore.name}` : "点击搜索附近商铺"}
        >
          <Text style={selectedStore ? styles.storeText : styles.storePlaceholder}>
            {selectedStore ? selectedStore.name : '点击选择或搜索商铺'}
          </Text>
          <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 3. 点评风格 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>点评风格</Text>
        <TouchableOpacity
          style={styles.styleSelector}
          onPress={() => setStyleModalVisible(true)}
          accessibilityLabel="选择点评风格"
          accessibilityRole="button"
          accessibilityHint={`当前风格: ${REVIEW_STYLES[selectedStyleIndex].name}`}
        >
          <Text style={styles.styleSelectorText}>
            {REVIEW_STYLES[selectedStyleIndex].name}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 3. 个人评价 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>简单感受 (选填)</Text>
        <TextInput 
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="有什么特别想夸或吐槽的？比如：服务太棒了、菜品很新鲜…（可留空）"
          placeholderTextColor={theme.colors.textSecondary}
          value={userReview}
          onChangeText={setUserReview}
          autoCorrect={false}
          accessibilityLabel="输入您的简单感受"
        />
      </View>

      {/* 5. 字数建议 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>字数建议（可手动修改）</Text>
        <TextInput 
          style={styles.input}
          placeholder="默认200-300字"
          placeholderTextColor={theme.colors.textSecondary}
          value={wordCount}
          onChangeText={setWordCount}
          keyboardType="numeric"
          autoCorrect={false}
          returnKeyType="done"
          accessibilityLabel="设置生成字数"
        />
      </View>

      {/* 6. 总体评分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>总体评分</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setRating(star);
              }}
              style={styles.starTouch}
              accessibilityLabel={`打分 ${star} 星`}
              accessibilityRole="button"
            >
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={32}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          ))}
          <Text style={styles.ratingText}>
            {rating === 5 && '🔥 超出预期'}
            {rating === 4 && '✨ 值得推荐'}
            {rating === 3 && '⚖️ 中规中矩'}
            {rating === 2 && '⚠️ 体验一般'}
            {rating === 1 && '💔 极其避雷'}
          </Text>
        </View>
      </View>

      {/* 7. 体验关键词 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>体验关键词 (多选)</Text>
        <View style={styles.tagsContainer}>
          {PRESET_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  if (isSelected) {
                    setSelectedTags(prev => prev.filter(t => t !== tag));
                  } else {
                    setSelectedTags(prev => [...prev, tag]);
                  }
                }}
                style={[
                  styles.tagChip,
                  isSelected && styles.tagChipActive
                ]}
                accessibilityLabel={`选择标签: ${tag}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <Text style={[
                  styles.tagChipText,
                  isSelected && styles.tagChipTextActive
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 界面错误提示 */}
      {globalError ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>{globalError}</Text>
        </View>
      ) : null}

      {/* 生成进度步骤条 */}
      {generating && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressTitle}>🦅 Hawk AI 点评生成进度</Text>
          
          {images.length > 0 && (
            <View style={styles.progressStepRow}>
              <Ionicons
                name={generationStep > 1 ? "checkmark-circle" : (generationStep === 1 ? "time-outline" : "ellipse-outline")}
                size={18}
                color={generationStep > 1 ? theme.colors.success : (generationStep === 1 ? theme.colors.primary : theme.colors.textTertiary)}
              />
              <Text style={[
                styles.progressStepText,
                generationStep === 1 && styles.progressStepActiveText,
                generationStep > 1 && styles.progressStepCompletedText
              ]}>
                1. 正在压缩优化多模态探店图片...
              </Text>
            </View>
          )}

          <View style={styles.progressStepRow}>
            <Ionicons
              name={generationStep > 2 ? "checkmark-circle" : (generationStep === 2 ? "time-outline" : "ellipse-outline")}
              size={18}
              color={generationStep > 2 ? theme.colors.success : (generationStep === 2 ? theme.colors.primary : theme.colors.textTertiary)}
            />
            <Text style={[
              styles.progressStepText,
              generationStep === 2 && styles.progressStepActiveText,
              generationStep > 2 && styles.progressStepCompletedText
            ]}>
              {images.length > 0 ? '2' : '1'}. 正在分析商铺定位与标签特征...
            </Text>
          </View>

          <View style={styles.progressStepRow}>
            <Ionicons
              name={generationStep > 3 ? "checkmark-circle" : (generationStep === 3 ? "time-outline" : "ellipse-outline")}
              size={18}
              color={generationStep > 3 ? theme.colors.success : (generationStep === 3 ? theme.colors.primary : theme.colors.textTertiary)}
            />
            <Text style={[
              styles.progressStepText,
              generationStep === 3 && styles.progressStepActiveText,
              generationStep > 3 && styles.progressStepCompletedText
            ]}>
              {images.length > 0 ? '3' : '2'}. 正在调用 HAWK AI 生成与排版评价...
            </Text>
          </View>
        </View>
      )}

      {/* 生成按钮 */}
      <TouchableOpacity 
        style={[styles.generateBtn, generating && styles.generateBtnDisabled]} 
        onPress={handleGenerate}
        disabled={generating}
        accessibilityLabel={generating ? "正在生成点评" : "一键生成点评"}
        accessibilityRole="button"
        accessibilityState={{ busy: generating }}
      >
        {generating ? (
          <View style={styles.generatingContainer}>
            <ActivityIndicator color="#000" size="small" />
            <Text style={styles.generatingText}>AI 思考中…</Text>
          </View>
        ) : (
          <Text style={styles.generateBtnText}>一键生成点评 🦅</Text>
        )}
      </TouchableOpacity>

      {/* 结果展示 (多卡片流) */}
      {reviewHistory.length > 0 && (
        <View style={styles.resultSection} accessibilityLiveRegion="polite">
          <Text style={styles.sectionTitle}>生成记录</Text>
          {reviewHistory.map((item) => (
            <View key={item.id} style={styles.resultCard}>
              <View style={styles.resultCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTime}>{item.timestamp} · {item.store}</Text>
                  <View style={styles.cardHeaderMeta}>
                    {item.rating && (
                      <Text style={styles.cardRating}>
                        {'⭐'.repeat(item.rating)}
                      </Text>
                    )}
                    <Text style={styles.hawkBadge}>HAWK AI 精选生成</Text>
                  </View>
                </View>
                <Ionicons name="flash" size={16} color={theme.colors.primary} accessibilityElementsHidden={true} />
              </View>
              {item.tags && item.tags.length > 0 && (
                <View style={styles.cardTagsRow}>
                  {item.tags.map(t => (
                    <View key={t} style={styles.cardTag}>
                      <Text style={styles.cardTagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.resultText}>{item.text}</Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => copyAndOpenDianping(item.text)}
                accessibilityLabel="复制并打开点评"
                accessibilityRole="button"
              >
                <Ionicons name="copy-outline" size={18} color="#1A1200" accessibilityElementsHidden={true} />
                <Text style={styles.copyBtnText}>复制并打开大众点评</Text>
              </TouchableOpacity>
            </View>
          ))}
          {/* 再写一条点评 */}
          <TouchableOpacity
            style={styles.rewriteBtn}
            onPress={handleResetInputs}
            accessibilityLabel="清空输入并重新编写"
            accessibilityRole="button"
          >
            <Ionicons name="refresh-outline" size={18} color={theme.colors.primary} accessibilityElementsHidden={true} />
            <Text style={styles.rewriteBtnText}>🔄 再写一条点评</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />



      {/* 版本更新 Modal (新增) */}
      <Modal visible={showUpdateModal} animationType="fade" transparent={true} accessibilityViewIsModal={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: 'auto', paddingBottom: theme.spacing.xl }]}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>发现新版本 ✨</Text>
              <TouchableOpacity
                onPress={() => setShowUpdateModal(false)}
                accessibilityLabel="关闭更新提示"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: theme.colors.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                {updateInfo?.tag_name}
              </Text>
              <Text style={{ color: theme.colors.text, lineHeight: 22, marginBottom: 24 }}>
                {updateInfo?.body || '由于版本迭代，建议您立即更新以获得最佳体验。'}
              </Text>
              
              <TouchableOpacity 
                style={styles.generateBtn}
                onPress={() => {
                  const url = updateInfo?.html_url || 'https://github.com/h382110229/DZDPRatingGenrator/releases';
                  import('react-native').then(({ Linking }) => Linking.openURL(url));
                  setShowUpdateModal(false);
                }}
                accessibilityLabel="前往下载新版本"
                accessibilityRole="button"
              >
                <Text style={styles.generateBtnText}>立即去下载</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 风格选择 Modal */}
      <Modal visible={styleModalVisible} animationType="slide" transparent={true} accessibilityViewIsModal={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择点评风格</Text>
              <TouchableOpacity
                onPress={() => setStyleModalVisible(false)}
                accessibilityLabel="关闭弹窗"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={REVIEW_STYLES}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.styleItem,
                    index === selectedStyleIndex && styles.styleItemActive,
                  ]}
                  onPress={() => {
                    setSelectedStyleIndex(index);
                    if (index === 0) {
                      const r = Math.floor(Math.random() * (REVIEW_STYLES.length - 1)) + 1;
                      setWordCount(String(REVIEW_STYLES[r].wordCount));
                    } else {
                      setWordCount(String(item.wordCount));
                    }
                    setStyleModalVisible(false);
                  }}
                  accessibilityLabel={item.name}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: index === selectedStyleIndex }}
                >
                  <Text style={[
                    styles.styleItemText,
                    index === selectedStyleIndex && styles.styleItemTextActive,
                  ]}>{item.name}</Text>
                  {index === selectedStyleIndex && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* 商铺选择 Modal */}
      <Modal visible={storeModalVisible} animationType="slide" transparent={true} accessibilityViewIsModal={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragIndicator} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择商铺</Text>
              <TouchableOpacity
                onPress={() => setStoreModalVisible(false)}
                accessibilityLabel="关闭弹窗"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchRow}>
              <TextInput 
                style={styles.searchInput}
                placeholder="搜索附近商铺 (支持模糊联想)…"
                placeholderTextColor={theme.colors.textSecondary}
                value={storeSearchQuery}
                onChangeText={handleFuzzySearch}
                autoCorrect={false}
                accessibilityLabel="搜索商铺名称"
              />
            </View>

            {searchingPoi ? (
              <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList 
                data={poiList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.poiItem}
                    onPress={() => {
                      setSelectedStore(item);
                      setStoreModalVisible(false);
                    }}
                    accessibilityLabel={item.name}
                    accessibilityRole="button"
                    accessibilityHint={item.address || item.type}
                  >
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
    backgroundColor: theme.colors.background,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  brandLogo: {
    width: 60,
    height: 60,
    marginBottom: theme.spacing.sm,
  },
  brandText: {
    fontSize: 38,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 8,
  },
  brandSub: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    letterSpacing: 4,
    marginTop: 4,
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionCount: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 2,
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  styleSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  styleSelectorText: {
    color: theme.colors.text,
    fontSize: 16,
    flex: 1,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    height: 110,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: 15,
  },
  generateBtn: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: 'bold',
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generatingText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  resultSection: {
    marginBottom: theme.spacing.xl,
  },
  resultCard: {
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  resultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  hawkBadge: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 2,
  },
  resultTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  resultText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 26,
  },
  copyBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.md,
  },
  copyBtnText: {
    color: '#1A1200',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: theme.spacing.sm,
  },
  rewriteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySubtle,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  rewriteBtnText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceElevated,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    maxHeight: '85%',
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
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
  styleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  styleItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  styleItemText: {
    color: theme.colors.text,
    fontSize: 16,
    flex: 1,
  },
  styleItemTextActive: {
    color: theme.colors.primary,
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
    padding: theme.spacing.md,
    fontSize: 15,
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
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  starTouch: {
    paddingRight: theme.spacing.xs,
  },
  ratingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginLeft: theme.spacing.sm,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  tagChip: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySubtle,
  },
  tagChipText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  tagChipTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  progressContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  progressTitle: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  progressStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  progressStepText: {
    color: theme.colors.textTertiary,
    fontSize: 13,
    marginLeft: theme.spacing.sm,
  },
  progressStepActiveText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  progressStepCompletedText: {
    color: theme.colors.success,
  },
  cardHeaderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: theme.spacing.sm,
  },
  cardRating: {
    fontSize: 12,
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: theme.spacing.sm,
  },
  cardTag: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardTagText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
