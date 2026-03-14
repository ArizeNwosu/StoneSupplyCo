#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NotificationSettingsPlugin, "NotificationSettings",
           CAP_PLUGIN_METHOD(requestPermission, CAPPluginReturnPromise);
)
