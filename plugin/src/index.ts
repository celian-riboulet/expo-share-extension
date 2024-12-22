import { type ExpoConfig } from "@expo/config-types";
import { ConfigPlugin, IOSConfig, withPlugins } from "expo/config-plugins";
import { z } from "zod";

import { withAppEntitlements } from "./withAppEntitlements";
import { withAppInfoPlist } from "./withAppInfoPlist";
import { withExpoConfig } from "./withExpoConfig";
import { withPodfile } from "./withPodfile";
import { withShareExtensionEntitlements } from "./withShareExtensionEntitlements";
import { withShareExtensionInfoPlist } from "./withShareExtensionInfoPlist";
import { withShareExtensionTarget } from "./withShareExtensionTarget";

export const getAppGroup = (identifier: string) => `group.${identifier}`;

export const getAppBundleIdentifier = (config: ExpoConfig) => {
  if (!config.ios?.bundleIdentifier) {
    throw new Error("No bundle identifier");
  }
  return config.ios?.bundleIdentifier;
};

export const getShareExtensionBundleIdentifier = (
  config: ExpoConfig,
  asActionExtension: boolean,
) => {
  return `${getAppBundleIdentifier(config)}.${asActionExtension ? "ActionExtension" : "ShareExtension"}`;
};

export const getShareExtensionName = (
  config: ExpoConfig,
  asActionExtension: boolean,
) => {
  return `${IOSConfig.XcodeUtils.sanitizedName(config.name)}${asActionExtension ? "ActionExtension" : "ShareExtension"}`;
};

export const getShareExtensionEntitlementsFileName = (
  config: ExpoConfig,
  asActionExtension: boolean,
) => {
  const name = getShareExtensionName(config, asActionExtension);
  return `${name}.entitlements`;
};

const rgbaSchema = z.object({
  red: z.number().min(0).max(255),
  green: z.number().min(0).max(255),
  blue: z.number().min(0).max(255),
  alpha: z.number().min(0).max(1),
});

export type BackgroundColor = z.infer<typeof rgbaSchema>;

const heightSchema = z.number().int().min(50).max(1000);

export type Height = z.infer<typeof heightSchema>;

type ActivationType = "image" | "video" | "text" | "url" | "file";

export type ActivationRule = {
  type: ActivationType;
  max?: number;
};

const withShareExtension: ConfigPlugin<{
  activationRules?: ActivationRule[];
  backgroundColor?: BackgroundColor;
  height?: Height;
  excludedPackages?: string[];
  googleServicesFile?: string;
  preprocessingFile?: string;
}> = (config, props) => {
  if (props?.backgroundColor) {
    rgbaSchema.parse(props.backgroundColor);
  }

  const expoFontPlugin = config.plugins?.find(
    (p) => Array.isArray(p) && p.length && p.at(0) === "expo-font",
  );

  const fonts = expoFontPlugin?.at(1).fonts ?? [];

  return withPlugins(config, [
    withExpoConfig,
    withAppEntitlements,
    withAppInfoPlist,
    [
      withPodfile,
      {
        excludedPackages: props?.excludedPackages ?? [],
        asActionExtension: true,
      },
    ],
    [
      withPodfile,
      {
        excludedPackages: props?.excludedPackages ?? [],
        asActionExtension: false,
      },
    ],
    [
      withShareExtensionInfoPlist,
      {
        fonts,
        activationRules: props?.activationRules,
        backgroundColor: props?.backgroundColor,
        height: props?.height,
        preprocessingFile: props?.preprocessingFile,
        googleServicesFile: props?.googleServicesFile,
        asActionExtension: true,
      },
    ],
    [
      withShareExtensionInfoPlist,
      {
        fonts,
        activationRules: props?.activationRules,
        backgroundColor: props?.backgroundColor,
        height: props?.height,
        preprocessingFile: props?.preprocessingFile,
        googleServicesFile: props?.googleServicesFile,
        asActionExtension: false,
      },
    ],
    [
      withShareExtensionEntitlements,
      {
        asActionExtension: true,
      },
    ],
    [
      withShareExtensionEntitlements,
      {
        asActionExtension: false,
      },
    ],
    [
      withShareExtensionTarget,
      {
        fonts,
        googleServicesFile: props?.googleServicesFile,
        preprocessingFile: props?.preprocessingFile,
        asActionExtension: true,
      },
    ],
    [
      withShareExtensionTarget,
      {
        fonts,
        googleServicesFile: props?.googleServicesFile,
        preprocessingFile: props?.preprocessingFile,
        asActionExtension: false,
      },
    ],
  ]);
};

export default withShareExtension;
