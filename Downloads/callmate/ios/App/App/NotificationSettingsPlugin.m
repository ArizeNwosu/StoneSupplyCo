#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NotificationSettingsPlugin, "NotificationSettingsPlugin",
           CAP_PLUGIN_METHOD(requestPermission, CAPPluginReturnPromise);
)
