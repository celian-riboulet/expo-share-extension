import { XcodeProject } from "expo/config-plugins";
import fs from "fs";
import path from "path";

export function addPbxGroup(
  xcodeProject: XcodeProject,
  {
    targetName,
    platformProjectRoot,
    // fonts = [],
    googleServicesFilePath,
    preprocessingFilePath,
    asActionExtension,
  }: {
    targetName: string;
    platformProjectRoot: string;
    // fonts: string[];
    googleServicesFilePath?: string;
    preprocessingFilePath?: string;
    asActionExtension: boolean;
  },
) {
  const targetPath = path.join(platformProjectRoot, targetName);
  const sharedResourcesPath = path.join(platformProjectRoot, "SharedResources");

  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  if (!fs.existsSync(sharedResourcesPath)) {
    fs.mkdirSync(sharedResourcesPath, { recursive: true });
  }

  copyFileSync(
    path.join(__dirname, "../../swift/ShareExtensionViewController.swift"),
    path.join(
      targetPath,
      `${asActionExtension ? "Action" : "Share"}ExtensionViewController.swift`,
    ),
  );

  //----------------------------------------------
  // In the file replace the class name with the target name
  // TODO the file should not be copied but shared between both extensions for consistency
  const file = path.join(
    targetPath,
    `${asActionExtension ? "Action" : "Share"}ExtensionViewController.swift`,
  );
  const data = fs.readFileSync(file, "utf8");
  const result = data.replace(
    /ShareExtensionViewController/g,
    `${targetName}ViewController`,
  );
  fs.writeFileSync(file, result, "utf8");

  // const fontFiles = [];
  // for (const font of fonts) {
  //   const fontName = path.basename(font);
  //   copyFileSync(font, sharedResourcesPath, fontName);
  //   fontFiles.push(fontName);
  // }

  const files = [
    `${asActionExtension ? "Action" : "Share"}ExtensionViewController.swift`,
    "Info.plist",
    `${targetName}.entitlements`,
    // ...fontFiles,
  ];

  if (googleServicesFilePath?.length) {
    copyFileSync(googleServicesFilePath, targetPath);
    files.push(path.basename(googleServicesFilePath));
  }

  if (preprocessingFilePath?.length) {
    copyFileSync(preprocessingFilePath, targetPath);
    files.push(path.basename(preprocessingFilePath));
  }

  // Add PBX group
  const { uuid: pbxGroupUuid } = xcodeProject.addPbxGroup(
    files,
    targetName,
    targetName,
  );

  // Add PBXGroup to top level group
  const groups = xcodeProject.hash.project.objects["PBXGroup"];
  if (pbxGroupUuid) {
    Object.keys(groups).forEach(function (key) {
      if (groups[key].name === undefined && groups[key].path === undefined) {
        xcodeProject.addToPbxGroup(pbxGroupUuid, key);
      }
    });
  }
}

function copyFileSync(source: string, target: string, basename?: string) {
  let targetFile = target;

  if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
    targetFile = path.join(target, basename ?? path.basename(source));
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source));
}
