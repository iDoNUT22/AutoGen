[app]title = AutoGen
package.name = autogen
package.domain = org.example
source.dir = .
source.include_exts = py,png,jpg,kv,json
version = 1.0
requirements = python3,kivy,pillow,pytesseract,opencv-python-headless
orientation = all
fullscreen = 1
android.permissions = WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE,CAMERA
android.minapi = 21
android.sdk = 30
android.ndk = 23b
android.archs = arm64-v8a,armeabi-v7a
android.gradle_dependencies = com.android.support:appcompat-v7:28.0.0

# Include Tesseract trained data if needed
# Add your .traineddata files into assets if OCR is used
android.add_asset_dirs = assets

# (optional) Presplash / Icon
icon.filename = %(source.dir)s/AutoGen.png
presplash.filename = %(source.dir)s/AutoGenSplash.png

[buildozer]
log_level = 2
warn_on_root = 1
