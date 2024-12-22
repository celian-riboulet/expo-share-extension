import { ConfigPlugin } from "@expo/config-plugins";
import { withXcodeProject } from "expo/config-plugins";
import path from "path";

import {
  getShareExtensionBundleIdentifier,
  getShareExtensionName,
} from "./index";
import { addBuildPhases } from "./xcode/addBuildPhases";
import { addPbxGroup } from "./xcode/addPbxGroup";
import { addProductFile } from "./xcode/addProductFile";
import { addTargetDependency } from "./xcode/addTargetDependency";
import { addToPbxNativeTargetSection } from "./xcode/addToPbxNativeTargetSection";
import { addToPbxProjectSection } from "./xcode/addToPbxProjectSection";
import { addXCConfigurationList } from "./xcode/addToXCConfigurationList";

export const withShareExtensionTarget: ConfigPlugin<{
  fonts: string[];
  googleServicesFile?: string;
  preprocessingFile?: string;
  asActionExtension: boolean;
}> = (
  config,
  { fonts = [], googleServicesFile, preprocessingFile, asActionExtension },
) => {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;

    const targetName = getShareExtensionName(config, asActionExtension);
    const bundleIdentifier = getShareExtensionBundleIdentifier(
      config,
      asActionExtension,
    );
    const marketingVersion = config.version;

    const targetUuid = xcodeProject.generateUuid();
    const groupName = asActionExtension
      ? "Embed Action Extensions"
      : "Embed Share Extensions";
    const { platformProjectRoot, projectRoot } = config.modRequest;

    if (config.ios?.googleServicesFile && !googleServicesFile) {
      console.warn(
        "Warning: No Google Services file specified for Share Extension",
      );
    }

    // const resources = fonts.map((font: string) => path.basename(font));
    const resources: string[] = [];

    const googleServicesFilePath = googleServicesFile
      ? path.resolve(projectRoot, googleServicesFile)
      : undefined;

    if (googleServicesFile) {
      resources.push(path.basename(googleServicesFile));
    }

    const preprocessingFilePath = preprocessingFile
      ? path.resolve(projectRoot, preprocessingFile)
      : undefined;

    if (preprocessingFile) {
      resources.push(path.basename(preprocessingFile));
    }

    const xCConfigurationList = addXCConfigurationList(xcodeProject, {
      targetName,
      currentProjectVersion: config.ios?.buildNumber || "1",
      bundleIdentifier,
      marketingVersion,
    });

    const productFile = addProductFile(xcodeProject, {
      targetName,
      groupName,
    });

    const target = addToPbxNativeTargetSection(xcodeProject, {
      targetName,
      targetUuid,
      productFile,
      xCConfigurationList,
    });

    addToPbxProjectSection(xcodeProject, target);

    addTargetDependency(xcodeProject, target);

    addPbxGroup(xcodeProject, {
      targetName,
      platformProjectRoot,
      // fonts,
      googleServicesFilePath,
      preprocessingFilePath,
      asActionExtension,
    });

    addBuildPhases(xcodeProject, {
      targetUuid,
      groupName,
      productFile,
      resources,
      asActionExtension,
    });

    return config;
  });
};
