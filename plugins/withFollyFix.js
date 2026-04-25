/**
 * withFollyFix.js
 *
 * Expo Config Plugin that patches the iOS Podfile to:
 *   1. Apply FOLLY_HAS_COROUTINES=0 to ALL CocoaPods targets
 *   2. Add the necessary header search paths globally
 *
 * This is required because folly/coro/Coroutine.h is not available
 * in the RCT-Folly version shipped with React Native 0.76 on iOS.
 *
 * Strategy: We patch the existing post_install block (added by Expo's
 * react_native_post_install) rather than adding a second post_install
 * block (Ruby CocoaPods only honours the last one).
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PATCH_MARKER = '# --- C&B FOLLY FIX v2 ---';

const FOLLY_PATCH_RUBY = `
    ${PATCH_MARKER}
    # Apply FOLLY_HAS_COROUTINES=0 to every target so folly/coro/Coroutine.h
    # is never compiled — this header is missing from RCT-Folly on iOS.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        # Disable Folly coroutines — the header is not present
        defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
        defs = [defs] unless defs.is_a?(Array)
        defs << 'FOLLY_HAS_COROUTINES=0' unless defs.include?('FOLLY_HAS_COROUTINES=0')
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs

        # Add Folly public headers to search paths so #include paths resolve
        paths = config.build_settings['HEADER_SEARCH_PATHS'] || '$(inherited)'
        paths = paths.join(' ') if paths.is_a?(Array)
        [
          '"$(PODS_ROOT)/Headers/Public"',
          '"$(PODS_ROOT)/Headers/Public/RCT-Folly"',
          '"$(PODS_ROOT)/Headers/Public/DoubleConversion"',
          '"$(PODS_ROOT)/Headers/Public/glog"',
          '"$(PODS_ROOT)/Headers/Public/React-Core"'
        ].each do |p|
          paths += " #{p}" unless paths.include?(p)
        end
        config.build_settings['HEADER_SEARCH_PATHS'] = paths
      end
    end
    # --- END C&B FOLLY FIX v2 ---
`;

const withFollyFix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.projectRoot,
        'ios',
        'Podfile'
      );

      let content = fs.readFileSync(podfilePath, 'utf8');

      // Idempotent: skip if already patched
      if (content.includes(PATCH_MARKER)) {
        console.log('✅ Folly fix already applied — skipping');
        return config;
      }

      // Find the react_native_post_install(...) call and inject our patch
      // immediately after it (still inside the existing post_install block).
      const anchor = 'react_native_post_install(';
      const anchorIdx = content.indexOf(anchor);

      if (anchorIdx === -1) {
        // Fallback: append a fresh post_install block (first-time prebuild)
        console.warn(
          '⚠️  react_native_post_install not found — appending standalone post_install block'
        );
        content += `\npost_install do |installer|\n${FOLLY_PATCH_RUBY}\nend\n`;
      } else {
        // Find the closing paren of react_native_post_install(...)
        let depth = 0;
        let i = anchorIdx + anchor.length - 1; // position of opening '('
        while (i < content.length) {
          if (content[i] === '(') depth++;
          else if (content[i] === ')') {
            depth--;
            if (depth === 0) break;
          }
          i++;
        }
        // i now points at the closing ')' of react_native_post_install(...)
        // Insert our patch on the next line
        const insertPos = i + 1;
        content =
          content.slice(0, insertPos) +
          '\n' +
          FOLLY_PATCH_RUBY +
          content.slice(insertPos);
      }

      fs.writeFileSync(podfilePath, content, 'utf8');
      console.log('✅ Folly coroutine fix applied to Podfile');

      return config;
    },
  ]);
};

module.exports = withFollyFix;
