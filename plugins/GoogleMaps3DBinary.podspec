Pod::Spec.new do |s|
  s.name = 'GoogleMaps3DBinary'
  s.version = '1.0.0'
  s.summary = 'Google Maps 3D SDK for iOS binary and required resources'
  s.description = 'CocoaPods packaging for the official Google Maps 3D SDK 1.0.0 binary used by the FreightIQ development proof of concept.'
  s.homepage = 'https://developers.google.com/maps/documentation/maps-3d/ios-sdk'
  s.license = { :type => 'Apache-2.0', :file => 'GoogleMaps3DResources/GoogleMaps3D.bundle/oss_licenses_maps3d.txt' }
  s.author = 'Google LLC'
  s.platform = :ios, '16.0'
  s.source = {
    :http => 'https://dl.google.com/geosdk/swiftpm/1.0.0/google_maps3d.xcframework.zip',
    :sha256 => 'b25a780bcf843ce4e0d0a57b0525b64d66269efeeb08c3987adf53664dd76829'
  }
  s.vendored_frameworks = 'GoogleMaps3D.xcframework'
  s.resources = 'GoogleMaps3DResources/GoogleMaps3D.bundle'
  s.libraries = 'sqlite3', 'c++'
  s.prepare_command = <<-CMD
    set -e
    curl -fsSL https://github.com/googlemaps/ios-maps-3d-sdk/archive/refs/tags/1.0.0.tar.gz -o google-maps-3d-spm.tar.gz
    tar -xzf google-maps-3d-spm.tar.gz
    mkdir -p GoogleMaps3DResources
    cp -R ios-maps-3d-sdk-1.0.0/Maps3D/Resources/GoogleMaps3DResources/GoogleMaps3D.bundle GoogleMaps3DResources/
    rm -rf google-maps-3d-spm.tar.gz ios-maps-3d-sdk-1.0.0
  CMD
end
