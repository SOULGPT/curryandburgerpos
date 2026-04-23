const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * This plugin patches the Podfile to fix the 'folly/coro/Coroutine.h' not found error
 * which occurs in some Reanimated 3 + New Arch/Classic Arch mixed environments.
 */
const withFollyFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      const patch = `
    installer.pods_project.targets.each do |target|
      if target.name == 'RCT-Folly'
        target.build_configurations.each do |config|
          config.build_settings['HEADER_SEARCH_PATHS'] = '$(inherited) "$(PODS_TARGET_SRCROOT)" "$(PODS_ROOT)/Headers/Public/RCT-Folly"'
        end
      end
    end`;

      if (!podfileContent.includes("target.name == 'RCT-Folly'")) {
        podfileContent = podfileContent.replace(
          /react_native_post_install\(.*?installer,.*?config\[:reactNativePath\].*?\)/s,
          `$& \n${patch}`
        );
        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};

module.exports = withFollyFix;
