#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(VoiceSimulatorPlugin, "VoiceSimulatorPlugin",
           CAP_PLUGIN_METHOD(prepareAudioSession, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(deactivateAudioSession, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startRecognition, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopRecognition, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(speak, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopSpeaking, CAPPluginReturnPromise);
)
