import React from 'react';
import { View, Text } from 'react-native';
import CrashReportingService from '../services/CrashReportingService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ERROR BOUNDARY CAUGHT:', {
      error: error.toString(),
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Report error to crashlytics with email context
    CrashReportingService.recordError(error, `ErrorBoundary: ${errorInfo.componentStack}`);
    CrashReportingService.log('Error caught by ErrorBoundary component');

    this.setState({ hasError: true, error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20,
          backgroundColor: '#f5f5f5' 
        }}>
          <Text style={{ 
            fontSize: 16, 
            color: '#d32f2f', 
            textAlign: 'center',
            marginBottom: 10 
          }}>
            🚨 Something went wrong
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#666', 
            textAlign: 'center',
            maxWidth: 300 
          }}>
            {this.state.error?.toString() || 'Unknown error occurred'}
          </Text>
          <Text style={{ 
            fontSize: 12, 
            color: '#999', 
            textAlign: 'center',
            marginTop: 10 
          }}>
            Please restart the app
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
