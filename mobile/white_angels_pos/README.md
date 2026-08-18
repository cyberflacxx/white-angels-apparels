# White Angels POS

Flutter POS companion app for White Angels Apparels.

## Requirements

- Flutter `3.35.5`
- Dart `3.9.2`
- Android SDK / Android Studio for APK builds

## Project path

`mobile/white_angels_pos`

## Architecture overview

- Flutter mobile client
- existing White Angels admin login
- authenticated POS API under `/api/v1/pos`
- no local stock database
- stock, pricing, and inventory come from the shared White Angels backend

Main areas:

- Home
- New Sale
- Sales
- Reports

## Install dependencies

```powershell
cd C:\Users\CyberFlacx\Desktop\WA\mobile\white_angels_pos
flutter pub get
```

## Development run

```powershell
flutter run --dart-define=API_BASE_URL=https://whiteangels.178.238.227.229.sslip.io/api/v1
```

## Production API configuration

The app uses compile-time configuration:

- `API_BASE_URL`

Default:

`https://whiteangels.178.238.227.229.sslip.io/api/v1`

## Quality commands

```powershell
dart format lib test
flutter analyze
flutter test
```

## Release build

```powershell
flutter build apk --release --dart-define=API_BASE_URL=https://whiteangels.178.238.227.229.sslip.io/api/v1
```

Default release output path:

`build/app/outputs/flutter-apk/app-release.apk`

## Release signing

The generated Android project still uses Flutter’s default debug signing for release until a private production signing setup is added manually.

No signing secrets or keystores are stored in this repository.
