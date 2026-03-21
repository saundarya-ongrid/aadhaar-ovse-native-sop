# VKYC Core (React Native)

React Native application that powers the VKYC SDK across all platforms. This is the core UI and business logic that gets embedded in native wrappers.

## 📦 Structure

```
vkyc-core/
├── src/
│   ├── App.tsx                 # Entry point
│   ├── config/                 # Configuration management
│   ├── screens/                # UI screens
│   ├── components/             # Reusable components
│   ├── services/               # API services
│   ├── navigation/             # Navigation setup
│   ├── hooks/                  # Custom hooks
│   ├── theme/                  # Theming system
│   └── types/                  # TypeScript types
├── index.js                    # App registration
└── package.json
```

## 🚀 Features

- Multi-step VKYC flow
- Document capture with auto-detection
- Face capture with liveness detection
- Video recording
- API integration
- Theme customization
- Event tracking
- Error handling
- Progress tracking

## 📱 Screens

1. **Welcome** - Introduction and permissions
2. **Document Capture** - Capture ID document
3. **Selfie Capture** - Capture face photo
4. **Liveness Check** - Perform liveness detection
5. **Video Recording** - Record verification video
6. **Processing** - Upload and process data
7. **Result** - Show success/failure

## 🔧 Configuration

Configuration is passed from native wrappers via `initialProps`:

```typescript
{
  token: string,
  apiKey: string,
  environment: 'staging' | 'production',
  theme?: {
    primaryColor: string,
    secondaryColor?: string,
    // ...
  },
  features?: {
    videoEnabled: boolean,
    autoCapture?: boolean,
    // ...
  },
  metadata?: Record<string, any>
}
```

## 🌉 Native Bridge

Communicates with native code via:

```typescript
import { NativeModules } from "react-native";

const { VKYCModule } = NativeModules;

// Success
VKYCModule.onSuccess(result);

// Failure
VKYCModule.onFailure(errorCode, message, details);

// Cancel
VKYCModule.onCancel();

// Events
VKYCModule.onEvent(eventName, metadata);
```

## 🏗️ Development

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📦 Building

```bash
# Bundle for Android
npm run bundle:android

# Bundle for iOS
npm run bundle:ios
```
