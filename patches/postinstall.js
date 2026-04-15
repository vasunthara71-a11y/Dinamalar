#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix @react-native-voice/voice Gradle issues
const voicePackagePath = path.join(__dirname, '../node_modules/@react-native-voice/voice/android/build.gradle');

if (fs.existsSync(voicePackagePath)) {
  let buildGradleContent = fs.readFileSync(voicePackagePath, 'utf8');
  
  // Replace deprecated jcenter() with google() and mavenCentral()
  buildGradleContent = buildGradleContent.replace(/jcenter\(\)/g, 'google()\n        mavenCentral()');
  
  // Add compileSdkVersion if missing
  if (!buildGradleContent.includes('compileSdkVersion')) {
    buildGradleContent = buildGradleContent.replace(
      /android {/,
      'android {\n    compileSdkVersion 33\n    buildToolsVersion "33.0.0"'
    );
  }
  
  // Add defaultConfig with minSdkVersion if missing
  if (!buildGradleContent.includes('defaultConfig')) {
    buildGradleContent = buildGradleContent.replace(
      /android {[\s\S]*?compileSdkVersion 33[\s\S]*?buildToolsVersion "33.0.0"/,
      'android {\n    compileSdkVersion 33\n    buildToolsVersion "33.0.0"\n    defaultConfig {\n        minSdkVersion 21\n        targetSdkVersion 33\n    }'
    );
  }
  
  fs.writeFileSync(voicePackagePath, buildGradleContent);
  console.log('Fixed @react-native-voice/voice Gradle configuration');
}
