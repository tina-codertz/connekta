const { withAppBuildGradle } = require('expo/config-plugins');

const OLD_HERMES_COMMAND =
  /hermesCommand\s*=\s*new File\(\["node",\s*"--print",\s*"require\.resolve\('react-native\/package\.json'\)"\]\.execute\(null,\s*rootDir\)\.text\.trim\(\)\)\.getParentFile\(\)\.getAbsolutePath\(\)\s*\+\s*"\/sdks\/hermesc\/%OS-BIN%\/hermesc"/;

const NEW_HERMES_COMMAND = `hermesCommand = new File(["node", "--print", "require.resolve('hermes-compiler/package.json')"].execute(null, rootDir).text.trim()).getParentFile().getAbsolutePath() + "/hermesc/%OS-BIN%/hermesc"`;

/** RN 0.83+ ships hermesc in hermes-compiler, not react-native/sdks/hermesc. */
function withHermesCompiler(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    let contents = config.modResults.contents;
    if (OLD_HERMES_COMMAND.test(contents)) {
      contents = contents.replace(OLD_HERMES_COMMAND, NEW_HERMES_COMMAND);
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withHermesCompiler;
