package com.kidguard.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "KidGuardBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null) {
            String action = intent.getAction();
            Log.i(TAG, "Received broadcast intent action: " + action);
            
            if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
                Intent.ACTION_QUICKBOOT_POWERON.equals(action) ||
                "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)) {
                
                Log.i(TAG, "Device reboot detected. Launching KidGuard background service / MainActivity...");
                
                Intent launchIntent = new Intent(context, MainActivity.class);
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                
                try {
                    context.startActivity(launchIntent);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to launch MainActivity on boot: " + e.getMessage(), e);
                }
            }
        }
    }
}
