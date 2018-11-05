@ECHO OFF
SETLOCAL

REM Exit with error level 0 if configuration is not required.
REM Exit with error level 1 if configuration is required but not possible.
REM Exit with error level 2 if configuration is required.
CALL "%~dp0check-install.cmd"
