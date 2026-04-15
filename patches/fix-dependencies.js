#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix AndroidX vs Android Support Library conflicts
const appGradlePath = path.join(__dirname, '../android/app/build.gradle');

if (fs.existsSync(appGradlePath)) {
  let appGradleContent = fs.readFileSync(appGradlePath, 'utf8');
  
  // Add dependency resolution to force AndroidX
  if (!appGradleContent.includes('android.useAndroidX=true')) {
    appGradleContent = appGradleContent.replace(
      /android {/,
      `android {\n    useLibrary 'org.apache.http.legacy'\n    defaultConfig {\n        vectorDrawables.useSupportLibrary = true\n    }\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_11\n        targetCompatibility JavaVersion.VERSION_11\n    }\n    packagingOptions {\n        pickFirst '**/libc++_shared.so'\n        pickFirst '**/libjsc.so'\n    }`
    );
  }
  
  // Add gradle.properties fix if not present
  const gradlePropertiesPath = path.join(__dirname, '../android/gradle.properties');
  if (fs.existsSync(gradlePropertiesPath)) {
    let gradlePropsContent = fs.readFileSync(gradlePropertiesPath, 'utf8');
    
    if (!gradlePropsContent.includes('android.useAndroidX=true')) {
      gradlePropsContent += '\n# Force use of AndroidX\nandroid.useAndroidX=true\nandroid.enableJetifier=true\n';
      fs.writeFileSync(gradlePropertiesPath, gradlePropsContent);
      console.log('Added AndroidX configuration to gradle.properties');
    }
  }
  
  fs.writeFileSync(appGradlePath, appGradleContent);
  console.log('Fixed AndroidX dependency conflicts in app/build.gradle');
}

// Exclude conflicting support libraries
const settingsGradlePath = path.join(__dirname, '../android/settings.gradle');
if (fs.existsSync(settingsGradlePath)) {
  let settingsContent = fs.readFileSync(settingsGradlePath, 'utf8');
  
  if (!settingsContent.includes('exclude \':react-native-voice/voice\'')) {
    settingsContent = settingsContent.replace(
      /include \':app'/,
      `include ':app'\n\n// Exclude conflicting support libraries\nconfigurations.all {\n    resolutionStrategy {\n        force 'androidx.core:core:1.8.0'\n        force 'androidx.versionedparcelable:versionedparcelable:1.1.1'\n        eachDependency { DependencyResolveDetails details ->\n            if (details.requested.group == 'com.android.support' && !details.requested.name.startsWith('multidex')) {\n                details.useVersion '28.0.0'\n            }\n        }\n    }\n}`
    );
  }
  
  fs.writeFileSync(settingsGradlePath, settingsContent);
  console.log('Fixed dependency resolution in settings.gradle');
}
