# Change Log

See changelog below


## [2.5.0] - 2023-12-04
- Fixed warning of falling back to file scheme for html files

## [2.4.0] - 2023-09-12
- Fixed preferred Custom browser option issue

## [2.3.0] - 2023-09-11
- Fixed space in Custom browser command issue

## [2.2.0] - 2022-07-12
- Added support for alternative document root folders
- Fixed double slashes url issue

## [2.1.0] - 2022-07-12
- Fixed file:/// scheme issue

## [2.0.0] - 2020-09-14
- Added document root folder autodetection

## [1.8.0] - 2018-12-31
- Added support for Opera
- Refactored open browser core
- Fixed Edge issue

## [1.7.4] - 2018-12-19
- Minor changes

## [1.7.3] - 2018-12-19
- Minor changes

## [1.7.0] - 2018-12-19
- Improved stability

## [1.6.0] - 2018-12-19
- Added `Custom url to open in browser` configuration option.  You can set eg. `http://${host}/${relativeDirnameDocumentRoot}/${fileBasename}`

  You can use variables substitutions see https://code.visualstudio.com/docs/editor/variables-reference

| Variable      | Value                       |
| ------------- |:----------------------------|
| ${workspaceFolder} | the path of the folder opened in VS Code |
| ${workspaceFolderBasename} | the name of the folder opened in VS Code without any slashes (/) |
| ${file} | the current opened file |
| ${relativeFile} | the current opened file relative to workspaceFolder |
| ${fileBasename} | the current opened file's basename |
| ${fileBasenameNoExtension} | the current opened file's basename with no file extension |
| ${fileDirname} | the current opened file's dirname |
| ${fileExtname} | the current opened file's extension |
| ${cwd} | the task runner's current working directory on startup |
| ${lineNumber} | the current selected line number in the active file |
| ${selectedText} | the current selected text in the active file |
| ${env:ENVIRONMENT_VARIABLE_NAME} | value of enviroment variable |
| ${config:CONFIG_NAME} | value of configuration (eg. `config:open-php-html-js-in-browser.documentRootFolder`) |
| ${host} | `localhost` hostname with port number |
| ${relativeDirnameDocumentRoot} | path relative to `documentRootFolder` configuration |

## [1.5.0] - 2018-12-19
- Edited document is automatically saved before `Open In Browser` command

## [1.4.0] - 2018-12-18
- Improved performance

## [1.3.0] - 2018-12-18
- Added fallback mode to file:/// when it's not possible to use http://localhost

## [1.2.1] - 2018-12-18
- Fixed missing dependencies

## [1.0.0] - 2018-12-18
- Initial release
