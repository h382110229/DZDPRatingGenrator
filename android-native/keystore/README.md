# 签名配置说明

## 生成签名密钥

首次发布前，需要生成 keystore 文件：

```bash
keytool -genkey -v -keystore hawk-review.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias hawk-review \
  -storepass hawk123 \
  -dname "CN=Hawk, OU=MSP, O=Hawk, L=Chengdu, ST=Sichuan, C=CN"
```

## 配置签名

在 `local.properties` 中添加：

```properties
store.file=../keystore/hawk-review.jks
store.password=hawk123
key.alias=hawk-review
key.password=hawk123
```

## 构建 Release APK

```bash
./gradlew assembleRelease
```

输出路径：`app/build/outputs/apk/release/app-release.apk`
