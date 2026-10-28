Pod::Spec.new do |s|
  s.name           = 'FreightIQ3DYardView'
  s.version        = '1.0.0'
  s.summary        = 'FreightIQ 3D Yard View bridge'
  s.description    = 'Development-only Expo module for the FreightIQ Google Maps 3D proof of concept.'
  s.author         = 'FreightIQ'
  s.homepage       = 'https://github.com/robbyeickhoff/freightiq-app'
  s.platforms      = {
    :ios => '16.4',
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  if ENV['APP_VARIANT'] == 'development'
    s.dependency 'GoogleMaps3DBinary', '1.0.0'
    s.pod_target_xcconfig = {
      'DEFINES_MODULE' => 'YES',
      'SWIFT_ACTIVE_COMPILATION_CONDITIONS' => '$(inherited) FREIGHTIQ_3D_YARD_VIEW'
    }
  else
    s.pod_target_xcconfig = {
      'DEFINES_MODULE' => 'YES'
    }
  end

  # Swift/Objective-C compatibility
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
