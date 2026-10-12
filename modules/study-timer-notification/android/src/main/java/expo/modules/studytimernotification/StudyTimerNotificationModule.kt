package expo.modules.studytimernotification

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Ongoing notification for a running study session. While running, Android itself draws
// a ticking chronometer (no JavaScript needs to run in the background); while paused it
// shows the time studied so far.
class StudyTimerNotificationModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }

  private val notificationManager: NotificationManager
    get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  override fun definition() = ModuleDefinition {
    Name("StudyTimerNotification")

    // Android 13+ asks the user; older versions don't need runtime permission
    AsyncFunction("requestPermissionAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
        promise.resolve(mapOf("granted" to true))
      } else {
        Permissions.askForPermissionsWithPermissionsManager(
          appContext.permissions,
          promise,
          Manifest.permission.POST_NOTIFICATIONS,
        )
      }
    }

    // title: subject name; elapsedSeconds: time studied so far; running: false when paused
    Function("show") { title: String, elapsedSeconds: Double, running: Boolean ->
      show(title, elapsedSeconds.toLong(), running)
    }

    Function("hide") {
      notificationManager.cancel(NOTIFICATION_ID)
    }
  }

  private fun show(title: String, elapsedSeconds: Long, running: Boolean) {
    ensureChannel()

    // Tapping the notification brings the app back
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    val contentIntent = launchIntent?.let {
      PendingIntent.getActivity(
        context,
        0,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context)
    }

    builder
      .setSmallIcon(R.drawable.ic_stat_study_timer)
      .setContentTitle(title)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setCategory(Notification.CATEGORY_STOPWATCH)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setContentIntent(contentIntent)

    if (running) {
      // The chronometer counts up from `when`, so start it `elapsedSeconds` in the past
      builder
        .setUsesChronometer(true)
        .setShowWhen(true)
        .setWhen(System.currentTimeMillis() - elapsedSeconds * 1000)
        .setContentText("Studying now · tap to open")
    } else {
      builder
        .setUsesChronometer(false)
        .setShowWhen(false)
        .setContentText("Paused at ${formatClock(elapsedSeconds)} · tap to resume")
    }

    // Without notification permission this is a no-op, never a crash
    notificationManager.notify(NOTIFICATION_ID, builder.build())
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    if (notificationManager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Study timer",
      // Low: shows in the shade and status bar without sound or vibration
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "Shows your running study session"
      setShowBadge(false)
    }
    notificationManager.createNotificationChannel(channel)
  }

  private fun formatClock(totalSeconds: Long): String {
    val h = totalSeconds / 3600
    val m = (totalSeconds % 3600) / 60
    val s = totalSeconds % 60
    return "%02d:%02d:%02d".format(h, m, s)
  }

  companion object {
    private const val CHANNEL_ID = "study_timer"
    private const val NOTIFICATION_ID = 4711
  }
}
