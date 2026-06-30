; MINT AI Content Workstation - Lightweight Installer
; Installs source code, runs npm install during setup

#define MyAppName "MINT AI Content Workstation"
#define MyAppVersion "0.2.0"
#define MyAppPublisher "MINT"
#define MyAppURL "https://github.com/Thatisshayan/Mint"
#define MyAppExeName "start-mint.bat"

[Setup]
AppId={{B8F8E4A2-3C7D-4E5F-9A1B-2D3E4F5A6B7C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\MINT
DefaultGroupName={#MyAppName}
OutputDir=..\installer\output
OutputBaseFilename=MINT_Setup_{#MyAppVersion}
Compression=lzma
SolidCompression=no
WizardStyle=modern
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
DisableProgramGroupPage=yes
LicenseFile=..\LICENSE
VersionInfoVersion=0.2.0
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Setup
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "installollama"; Description: "Install Ollama (local AI engine)"; GroupDescription: "AI Services:"
Name: "installcomfyui"; Description: "Install ComfyUI (image generation)"; GroupDescription: "AI Services:"

[Files]
; Source code only (no node_modules - npm install runs post-install)
Source: "..\backend\src\*"; DestDir: "{app}\backend\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\backend\prisma\*"; DestDir: "{app}\backend\prisma"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.db,*.db-journal,*.db-shm,*.db-wal,*.sqlite,*.sqlite-journal,*.sqlite-shm,*.sqlite-wal"
Source: "..\frontend\src\*"; DestDir: "{app}\frontend\src"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\frontend\public\*"; DestDir: "{app}\frontend\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\frontend\dist\*"; DestDir: "{app}\frontend\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

; Config files
Source: "..\package.json"; DestDir: "{app}"; Flags: ignoreversion
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
Source: "..\.env"; DestDir: "{app}"; Flags: ignoreversion

; Backend config
Source: "..\backend\package.json"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "..\backend\.env"; DestDir: "{app}\backend"; Flags: ignoreversion

; Scripts
Source: "..\start-mint.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\stop-mint.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "download-ollama.bat"; DestDir: "{app}\installer"; Flags: ignoreversion
Source: "download-comfyui.bat"; DestDir: "{app}\installer"; Flags: ignoreversion

; Piper TTS
Source: "D:\AgentDevWork\Programs\piper-tts\*"; DestDir: "{app}\piper-tts"; Flags: ignoreversion recursesubdirs createallsubdirs

[Dirs]
Name: "{app}\data"
Name: "{app}\logs"

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
; Install Ollama if task selected
Filename: "{app}\installer\download-ollama.bat"; StatusMsg: "Installing Ollama..."; Tasks: installollama; Flags: runhidden waituntilterminated shellexec

; Install ComfyUI if task selected
Filename: "{app}\installer\download-comfyui.bat"; Parameters: "{app}"; StatusMsg: "Installing ComfyUI..."; Tasks: installcomfyui; Flags: runhidden waituntilterminated shellexec

; Install npm dependencies
Filename: "cmd"; Parameters: "/c cd /d ""{app}"" && npm install"; StatusMsg: "Installing npm dependencies..."; Flags: runhidden waituntilterminated

; Install backend dependencies
Filename: "cmd"; Parameters: "/c cd /d ""{app}\backend"" && npm install"; StatusMsg: "Installing backend dependencies..."; Flags: runhidden waituntilterminated

; Generate Prisma client
Filename: "cmd"; Parameters: "/c cd /d ""{app}\backend"" && npx prisma generate --schema prisma/schema.prisma"; StatusMsg: "Generating Prisma client..."; Flags: runhidden waituntilterminated

; Run database migrations
Filename: "cmd"; Parameters: "/c cd /d ""{app}\backend"" && npx prisma migrate dev --name init --schema prisma/schema.prisma --skip-generate"; StatusMsg: "Running database migrations..."; Flags: runhidden waituntilterminated

; Launch after install
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    CreateDir(ExpandConstant('{app}\data'));
    CreateDir(ExpandConstant('{app}\logs'));
  end;
end;
