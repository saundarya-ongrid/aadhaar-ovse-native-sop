package com.vkyc.sdk

import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.common.LifecycleState
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader

/**
 * Activity that hosts the React Native VKYC flow
 * 
 * This activity:
 * - Creates a React Native instance
 * - Passes configuration via initialProperties
 * - Handles lifecycle events
 * - Manages back button behavior
 */
class VKYCActivity : AppCompatActivity(), DefaultHardwareBackBtnHandler {
    
    companion object {
        private const val TAG = "VKYCActivity"
    }
    
    private var reactRootView: ReactRootView? = null
    private var reactInstanceManager: ReactInstanceManager? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d(TAG, "onCreate")
        
        try {
            // Initialize SoLoader for React Native
            SoLoader.init(this, false)
            
            // Get config from intent
            val configBundle = intent.extras
            
            // Create React Root View
            reactRootView = ReactRootView(this)
            
            // Create React Instance Manager
            reactInstanceManager = ReactInstanceManager.builder()
                .setApplication(application)
                .setCurrentActivity(this)
                .setBundleAssetName("index.android.bundle")
                .setJSMainModulePath("index")
                .addPackage(MainReactPackage())
                .addPackage(VKYCReactPackage()) // Custom package for VKYC bridge
                .setUseDeveloperSupport(BuildConfig.DEBUG)
                .setInitialLifecycleState(LifecycleState.RESUMED)
                .build()
            
            // Start React application
            reactRootView?.startReactApplication(
                reactInstanceManager,
                "VKYCApp", // Must match registered component name in RN
                configBundle // Initial properties passed to React Native
            )
            
            setContentView(reactRootView)
            
            Log.d(TAG, "React Native view created successfully")
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to create React Native view", e)
            
            // Notify failure
            VKYC.triggerFailure(
                VKYCError(
                    code = VKYCError.ErrorCode.REACT_NATIVE_ERROR,
                    message = "Failed to initialize React Native",
                    cause = e
                )
            )
            
            finish()
        }
    }
    
    override fun onPause() {
        super.onPause()
        reactInstanceManager?.onHostPause(this)
    }
    
    override fun onResume() {
        super.onResume()
        reactInstanceManager?.onHostResume(this, this)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        Log.d(TAG, "onDestroy")
        
        reactRootView?.unmountReactApplication()
        reactRootView = null
        
        reactInstanceManager?.onHostDestroy(this)
        reactInstanceManager = null
    }
    
    override fun onBackPressed() {
        if (reactInstanceManager != null) {
            reactInstanceManager?.onBackPressed()
        } else {
            super.onBackPressed()
        }
    }
    
    override fun invokeDefaultOnBackPressed() {
        super.onBackPressed()
    }
    
    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_MENU && reactInstanceManager != null) {
            reactInstanceManager?.showDevOptionsDialog()
            return true
        }
        return super.onKeyUp(keyCode, event)
    }
}
