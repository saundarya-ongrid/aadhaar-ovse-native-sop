/**
 * React Native Entry Point
 * Registers the VKYC app component
 */

import { AppRegistry } from 'react-native';
import App from './src/App';

// Register the app with the name that native code will use to load the bundle
AppRegistry.registerComponent('VKYCApp', () => App);
