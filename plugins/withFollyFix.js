const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFollyFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      const patch = `
# --- C&B FOLLY FIX START ---
post_install do |installer|
  installer.pods_project.targets.each do |target|
    if ['RCT-Folly', 'RNReanimated', 'React-Core', 'React-RCTFabric'].include?(target.name)
      target.build_configurations.each do |config|
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'
        
        config.build_settings['HEADER_SEARCH_PATHS'] ||= '$(inherited)'
        config.build_settings['HEADER_SEARCH_PATHS'] << ' "$(PODS_ROOT)/Headers/Public/RCT-Folly"'
        config.build_settings['HEADER_SEARCH_PATHS'] << ' "$(PODS_ROOT)/Headers/Public/DoubleConversion"'
        config.build_settings['HEADER_SEARCH_PATHS'] << ' "$(PODS_ROOT)/Headers/Public/glog"'
      end
    end
  end
end
# --- C&B FOLLY FIX END ---
`;


      if (!podfileContent.includes("C&B FOLLY FIX")) {
        podfileContent += patch;
        fs.writeFileSync(podfilePath, podfileContent);
        console.log('✅ Successfully appended Folly Fix to Podfile');
      }


      return config;
    },
  ]);
};

module.exports = withFollyFix;
