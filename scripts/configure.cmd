@ECHO OFF
SETLOCAL

REM Check for configuration.
CALL "%~dp0check-configure.cmd"
IF NOT ERRORLEVEL 2 EXIT /B
net file > NUL 2> NUL
IF ERRORLEVEL 1 (
	ECHO Configuration will continue in an elevated command prompt.
	cscript //nologo "%~dp0elevate.vbs" "%~f0 %~1"
	EXIT /B
) ELSE IF "%~1" == "" (
	SET PAUSE=PAUSE
) ELSE (
	SET PAUSE=
)

REM Run the installation script first.
CALL "%~dp0install.cmd" -
IF ERRORLEVEL 1 GOTO done

REM Install run-time dependencies.
CD /D "%~dp0.."
PATH %PATH%;%SystemDrive%\Python27;%ProgramFiles%\nodejs;%ProgramFiles(x86)%\Yarn\bin;%ProgramFiles%\Git\cmd
CALL "%~dp0do-yarn.cmd"
IF ERRORLEVEL 1 GOTO done

:done
IF ERRORLEVEL 1 %PAUSE% TYPE NUL
