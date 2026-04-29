export default {
  android: {
    gradle: {
      properties: {
        "android.useAndroidX": "true",
        "android.enableJetifier": "true",
        "android.enableR8.fullMode": "true",
        "org.gradle.jvmargs": "-Xmx6144m -XX:MaxMetaspaceSize=1024m",
        "org.gradle.parallel": "true",
        "org.gradle.daemon": "true",
        "org.gradle.caching": "true"
      }
    }
  }
};
