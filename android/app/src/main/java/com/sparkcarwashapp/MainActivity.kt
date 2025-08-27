package com.sparkcarwashapp

import android.os.Bundle;
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
// This import is no longer needed
// import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.ReactRootView
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "SparkCarWashApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to easily enable Fabric and Concurrent React (A.K.A. React 18).
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    // This method is now simplified to remove the New Architecture references
    return object : DefaultReactActivityDelegate(
      this,
      mainComponentName
    ) {
      override fun createRootView(): ReactRootView {
        return RNGestureHandlerEnabledRootView(this@MainActivity)
      }
    }
  }
}
