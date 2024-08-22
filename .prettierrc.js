module.exports = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed', // See whether the objective quantity attribute of the object is wrapped in quotes, (‘as-indicate’: No special requirements, prohibited use, 'consistent': keep consistent, preserve: unlimited, use it if you want))
  jsxSingleQuote: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  arrowParens: 'always',
  requirePragma: false, // Whether the code is formatted by the special annotation on the top of the file
  insertPragma: false, // Whether to insert the Pragma mark on the top of the format file to indicate that the file has been formatted by the prettier format
  proseWrap: 'preserve', // Fold according to the original file
  htmlWhitespaceSensitivity: 'ignore', // The space sensitivity of the html file, whether the control space affects the layout
  endOfLine: 'auto', // The end is \n\r \n\r auto
};
