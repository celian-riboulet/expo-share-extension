import { ConfigPlugin } from "@expo/config-plugins";
import { ExpoConfig } from "@expo/config-types";

import {
  getAppBundleIdentifier,
  getAppGroup,
  getShareExtensionBundleIdentifier,
  getShareExtensionName,
} from "./index";

type iOSExtensionConfig = {
  targetName: string;
  bundleIdentifier: string;
  entitlements: Record<string, string>;
};

// extend expo app config with app extension config for our share extension
export const withExpoConfig: ConfigPlugin = (config) => {
  if (!config.ios?.bundleIdentifier) {
    throw new Error("You need to specify ios.bundleIdentifier in app.json.");
  }

  const appBundleIdentifier = getAppBundleIdentifier(config);

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      eas: {
        ...(config.extra?.eas ?? {}),
        build: {
          ...(config.extra?.eas?.build ?? {}),
          experimental: {
            ...(config.extra?.eas?.build?.experimental ?? {}),
            ios: {
              ...(config.extra?.eas?.build?.experimental?.ios ?? {}),
              appExtensions: [
                // {
                //   ...(shareExtensionConfig ?? {
                //     targetName: extensionName,
                //     bundleIdentifier: extensionBundleIdentifier,
                //   }),
                //   entitlements: {
                //     ...shareExtensionConfig?.entitlements,
                //     "com.apple.security.application-groups": [
                //       getAppGroup(config.ios?.bundleIdentifier),
                //     ],
                //     ...(config.ios.usesAppleSignIn && {
                //       "com.apple.developer.applesignin": ["Default"],
                //     }),
                //   },
                // },
                // ...(iosExtensions?.filter(
                //   (extension) => extension.targetName !== extensionName,
                // ) ?? []),

                // TODO Share Extension
                getAppExtensionConfig(config, false),
                // TODO Action Extension
                getAppExtensionConfig(config, true),

                // TODO Other extensions
                // BIG TODO: Add support for other extensions
              ],
            },
          },
        },
      },
      appleApplicationGroup: getAppGroup(appBundleIdentifier),
    },
  };
};

const getAppExtensionConfig = (
  config: ExpoConfig,
  asActionExtension: boolean,
) => {
  const extensionName = getShareExtensionName(config, asActionExtension);
  const extensionBundleIdentifier = getShareExtensionBundleIdentifier(
    config,
    asActionExtension,
  );

  const iosExtensions: iOSExtensionConfig[] =
    config.extra?.eas?.build?.experimental?.ios?.appExtensions;

  const shareExtensionConfig = iosExtensions?.find(
    (extension) => extension.targetName === extensionName,
  );

  return {
    ...(shareExtensionConfig ?? {
      targetName: extensionName,
      bundleIdentifier: extensionBundleIdentifier,
    }),
    entitlements: {
      ...shareExtensionConfig?.entitlements,
      "com.apple.security.application-groups": [
        getAppGroup(config.ios!.bundleIdentifier!),
      ],
      ...(config.ios!.usesAppleSignIn && {
        "com.apple.developer.applesignin": ["Default"],
      }),
    },
  };
};
