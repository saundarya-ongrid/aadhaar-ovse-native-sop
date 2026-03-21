# VKYC SDK ProGuard Rules

# Keep VKYC SDK public API
-keep public class com.vkyc.sdk.VKYC { *; }
-keep public class com.vkyc.sdk.VKYCConfig { *; }
-keep public class com.vkyc.sdk.VKYCConfig$** { *; }
-keep public interface com.vkyc.sdk.VKYCCallback { *; }
-keep public class com.vkyc.sdk.VKYCCallbackAdapter { *; }
-keep public class com.vkyc.sdk.VKYCError { *; }
-keep public class com.vkyc.sdk.VKYCError$** { *; }

# Keep Activity
-keep public class com.vkyc.sdk.VKYCActivity { *; }

# Keep React Native Module
-keep public class com.vkyc.sdk.VKYCModule { *; }
-keep public class com.vkyc.sdk.VKYCReactPackage { *; }

# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip
-keep,allowobfuscation @interface com.facebook.jni.annotations.DoNotStrip

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.common.internal.DoNotStrip class *
-keep @com.facebook.jni.annotations.DoNotStrip class *

-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
    @com.facebook.jni.annotations.DoNotStrip *;
}

-keepclassmembers @com.facebook.proguard.annotations.KeepGettersAndSetters class * {
  void set*(***);
  *** get*();
}

-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }

-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**

# Keep SoLoader
-keep class com.facebook.soloader.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**
