/**
 * Theme System
 * Provides theme colors and styles based on configuration
 */

import { StyleSheet } from "react-native";
import ConfigManager from "../config/ConfigManager";
import { VKYCTheme } from "../types";

class ThemeManager {
   /**
    * Get current theme
    */
   getTheme(): VKYCTheme {
      return ConfigManager.getTheme();
   }

   /**
    * Get theme colors
    */
   getColors() {
      const theme = this.getTheme();

      return {
         primary: theme.primaryColor,
         secondary: theme.secondaryColor || "#764ba2",
         text: theme.textColor || "#333333",
         textSecondary: "#666666",
         background: theme.backgroundColor || "#FFFFFF",
         error: "#E53E3E",
         success: "#38A169",
         warning: "#DD6B20",
         border: "#E2E8F0",
         disabled: "#A0AEC0",
         white: "#FFFFFF",
         black: "#000000",
      };
   }

   /**
    * Get common styles
    */
   getCommonStyles() {
      const colors = this.getColors();
      const theme = this.getTheme();

      return StyleSheet.create({
         container: {
            flex: 1,
            backgroundColor: colors.background,
         },
         centerContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
            padding: 20,
         },
         title: {
            fontSize: 28,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: 8,
            textAlign: "center",
            fontFamily: theme.fontFamily,
         },
         subtitle: {
            fontSize: 16,
            color: colors.textSecondary,
            marginBottom: 24,
            textAlign: "center",
            fontFamily: theme.fontFamily,
         },
         button: {
            backgroundColor: colors.primary,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: theme.buttonRadius || 8,
            alignItems: "center",
            justifyContent: "center",
            minWidth: 200,
         },
         buttonText: {
            color: colors.white,
            fontSize: 16,
            fontWeight: "600",
            fontFamily: theme.fontFamily,
         },
         secondaryButton: {
            backgroundColor: "transparent",
            borderWidth: 2,
            borderColor: colors.primary,
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: theme.buttonRadius || 8,
            alignItems: "center",
            justifyContent: "center",
            minWidth: 200,
         },
         secondaryButtonText: {
            color: colors.primary,
            fontSize: 16,
            fontWeight: "600",
            fontFamily: theme.fontFamily,
         },
         errorText: {
            color: colors.error,
            fontSize: 14,
            textAlign: "center",
            marginTop: 8,
         },
         card: {
            backgroundColor: colors.white,
            borderRadius: 12,
            padding: 20,
            marginVertical: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
         },
         progressBar: {
            height: 4,
            backgroundColor: colors.border,
            borderRadius: 2,
            overflow: "hidden",
         },
         progressFill: {
            height: "100%",
            backgroundColor: colors.primary,
         },
         loading: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
         },
      });
   }
}

// Export singleton instance
export default new ThemeManager();
