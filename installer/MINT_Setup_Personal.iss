; MINT AI Content Workstation - Personal Use Installer (portable)
; One-click installer for personal single-user installations.
; Build: "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\MINT_Setup_Personal.iss
;
; Notes for future-you:
; - Source-only build (no node_modules baked in) means ~10 MB instead of ~88 MB
;   and lets each machine pick its own npm registry / native modules.
; - Piper / ComfyUI paths are NOT hardcoded; the backend reads them from .env.
; - After install, npm install + prisma migrate run automatically. Then
;   start-mint.bat launches all services and opens the Settings page.

#define MyAppName "MINT AI Content Workstation"
#define MyAppVersion "0.3.3"
#define MyAppPublisher "MINT"
#define MyAppURL "https://github.com/Thatisshayan/Mint"
#define MyAppExeName "start-mint.bat"

[Setup]
AppId={{C9F8B5E1-7A2D-4E6F-9B3C-1D2E8A4F5C7B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\MINT
DefaultGroupName={#MyAppName}
OutputDir=..\installer\output
OutputBaseFilename=MINT_Setup_Personal_{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
LicenseFile=..\LICENSE
VersionInfoVersion=0.3.3
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} (Personal Use) Setup
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
WelcomeLabel2=This installs MINT, an AI Content Workstation with local Ollama, ComfyUI, and Piper TTS integration. After install it will download dependencies and prepare your database, then open the Settings page on first launch.

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "installollama"; Description: "Install Ollama via official installer (recommended)"; GroupDescription: "AI Services:"
Name: "installcomfyui"; Description: "Install ComfyUI + SD 1.5 model (heavy download)"; GroupDescription: "AI Services:"

[Files]
; Source code only - npm install runs post-install
Source: "..\backend\src\*"; DestDir: "{app}\backend\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\backend\prisma\*"; DestDir: "{app}\backend\prisma"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.db,*.db-journal,*.db-shm,*.db-wal,*.sqlite,*.sqlite-journal,*.sqlite-shm,*.sqlite-wal"
Source: "..\frontend\src\*"; DestDir: "{app}\frontend\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\frontend\public\*"; DestDir: "{app}\frontend\public"; Flags: ignoreversion recursesubdirs createallsubdirs

; Top-level config files
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\package-lock.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\bun.lockb"; DestDir: "{app}"; Flags: ignoreversion ignoreversion
Source: "..\vite.config.ts"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\tailwind.config.ts"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\postcss.config.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\tsconfig.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\tsconfig.app.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\tsconfig.node.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\components.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\eslint.config.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\vitest.config.ts"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\index.html"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\vite-env.d.ts"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\app-icon.png"; DestDir: "{app}"; Flags: ignoreversion

; Backend config
Source: "..\backend\package.json"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\tsconfig.json"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\tsconfig.build.json"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\.env"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\.env.example"; DestDir: "{app}\backend"; Flags: ignoreversion

; Top-level scripts
Source: "..\start-mint.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\stop-mint.bat"; DestDir: "{app}"; Flags: ignoreversion

; Installer helpers (carried over so users can re-download Ollama/ComfyUI)
Source: "download-ollama.bat"; DestDir: "{app}\installer"; Flags: ignoreversion
Source: "download-comfyui.bat"; DestDir: "{app}\installer"; Flags: ignoreversion

[Dirs]
Name: "{app}\data"
Name: "{app}\logs"
Name: "{app}\installer"

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon
Name: "{group}\MINT Settings"; Filename: "{app}\MINT_Settings.url"

[Run]
; Optional AI service installs (these are heavy downloads; don't gate the install on them)
Filename: "{app}\installer\download-ollama.bat"; StatusMsg: "Installing Ollama..."; Tasks: installollama; Flags: runhidden waituntilterminated shellexec
Filename: "{app}\installer\download-comfyui.bat"; Parameters: "{app}"; StatusMsg: "Installing ComfyUI..."; Tasks: installcomfyui; Flags: runhidden waituntilterminated shellexec

; Always: install npm deps at top level + backend
Filename: "cmd"; Parameters: "/c cd /d ""{app}"" && npm install"; StatusMsg: "Installing npm dependencies (frontend)..."; Flags: runhidden waituntilterminated
Filename: "cmd"; Parameters: "/c cd /d ""{app}\backend"" && npm install"; StatusMsg: "Installing npm dependencies (backend)..."; Flags: runhidden waituntilterminated

; Generate Prisma client.
Filename: "cmd"; Parameters: "/c cd /d ""{app}\backend"" && npx prisma generate --schema prisma/schema.prisma"; StatusMsg: "Generating Prisma client..."; Flags: runhidden waituntilterminated

; Run migrations. If the DB already has tables but no migration history
; (typical when bundled raw-SQL ran on first start), 'deploy' fails with
; P3005. Try 'resolve --applied' first to baseline, then deploy.
Filename: "cmd"; Parameters: "/c cd /d ""{app}\backend"" && npx prisma migrate resolve --applied 20260628094810_init --schema prisma/schema.prisma 2>NUL & npx prisma migrate deploy --schema prisma/schema.prisma"; StatusMsg: "Running database migrations..."; Flags: runhidden waituntilterminated

; Launch the app — start-mint.bat handles service orchestration + first-run Settings redirect
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    CreateDir(ExpandConstant('{app}\data'));
    CreateDir(ExpandConstant('{app}\logs'));
    CreateDir(ExpandConstant('{app}\installer'));
  end;
end;
