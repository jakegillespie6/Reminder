## Raspberry Pi Services & Kiosk Startup

The Reminder dashboard uses three systemd services and a Labwc startup script to automatically start the application when the Raspberry Pi boots.

### Nginx Service

**File:**
`nginx.service`

**Location:**
`/usr/lib/systemd/system/nginx.service`

**Purpose:**
Runs the Nginx web server used to serve the production React frontend and handle configured reverse-proxy behavior.

The React application is built separately and copied into:

```text
/var/www/reminder/
```

Nginx serves these static production files. There is no separate Node/Vite service required to run the frontend in production.

Check the service:

```bash
systemctl status nginx
```

Nginx is enabled at boot through systemd.

---

### Reminder Backend Service

**File:**
`reminder.service`

**Location:**
`/etc/systemd/system/reminder.service`

**Purpose:**
Runs the Django backend using Uvicorn.

The service runs from:

```text
/home/jakegillespie06/Reminder/server
```

and starts the Django ASGI application with:

```bash
/home/jakegillespie06/Reminder/server/venv/bin/uvicorn \
    core.asgi:application \
    --host 127.0.0.1 \
    --port 8000
```

The backend is therefore available locally at:

```text
http://127.0.0.1:8000
```

The service is configured to automatically restart if the backend exits.

Useful commands:

```bash
systemctl status reminder
sudo systemctl restart reminder
sudo systemctl stop reminder
sudo systemctl start reminder
```

---

### Motion Sensor Service

**File:**
`motion-sensor.service`

**Location:**
`/etc/systemd/system/motion-sensor.service`

**Purpose:**
Configures the display orientation and starts the Raspberry Pi motion sensing script.

Before starting the Python script, the service rotates:

```text
HDMI-A-2
```

90 degrees using:

```bash
wlr-randr --output HDMI-A-2 --transform 90
```

It then starts:

```text
/home/jakegillespie06/motion_test.py
```

using Python 3.

The service is configured to restart automatically if the motion sensing script fails.

Useful commands:

```bash
systemctl status motion-sensor
sudo systemctl restart motion-sensor
sudo systemctl stop motion-sensor
sudo systemctl start motion-sensor
```

---

### Reminder Kiosk Startup Script

**File:**
`start-reminder-kiosk.sh`

**Location:**
`/home/jakegillespie06/start-reminder-kiosk.sh`

**Purpose:**
Starts the graphical Reminder dashboard after the backend and frontend are available.

This is a shell script rather than a systemd service.

The script:

1. Waits until the Django backend responds on `127.0.0.1:8000`.
2. Waits until Nginx responds on `127.0.0.1`.
3. Ensures an old Reminder Chromium process is not already running.
4. Launches Chromium using Wayland in kiosk mode.
5. Opens:

```text
https://py-reminders.app/dashboard
```

6. Hides the mouse cursor after Chromium launches.

The script must be executable:

```bash
chmod +x /home/jakegillespie06/start-reminder-kiosk.sh
```

It can also be run manually with:

```bash
/home/jakegillespie06/start-reminder-kiosk.sh
```

Logs from the script are written to:

```text
/tmp/reminder-kiosk.log
```

View them with:

```bash
cat /tmp/reminder-kiosk.log
```

---

### Labwc Autostart

**File:**
`autostart`

**Location:**
`/home/jakegillespie06/.config/labwc/autostart`

**Purpose:**
Automatically starts the Reminder kiosk script once the Labwc graphical environment has started.

The file contains:

```bash
#!/bin/sh

/home/jakegillespie06/start-reminder-kiosk.sh &
```

This is what causes Chromium to automatically open after boot.

`start-reminder-kiosk.sh` does **not** need to be enabled through systemd. Labwc executes it automatically.

---

## Boot Sequence

The expected Raspberry Pi boot sequence is:

```text
Raspberry Pi Boot
│
├── nginx.service
│   └── Serves React frontend
│
├── reminder.service
│   └── Starts Django/Uvicorn on port 8000
│
└── Graphical Environment / Labwc
    │
    ├── motion-sensor.service
    │   ├── Rotates HDMI-A-2 by 90°
    │   └── Starts motion_test.py
    │
    └── Labwc autostart
        │
        └── start-reminder-kiosk.sh
            │
            ├── Wait for Django
            ├── Wait for Nginx
            ├── Launch Chromium
            └── Hide cursor
```

The three systemd services should all be enabled:

```bash
systemctl is-enabled nginx
systemctl is-enabled reminder
systemctl is-enabled motion-sensor
```

Expected output for each:

```text
enabled
```

The Chromium kiosk does not require its own systemd service. It is launched by `start-reminder-kiosk.sh`, which is in turn launched by Labwc.

## Deployment / Restart

### Frontend

From the Reminder client directory:

```bash
git pull origin master
npm run build
sudo rm -rf /var/www/reminder/*
sudo cp -r dist/* /var/www/reminder/
```

Nginx does not normally need to be restarted when replacing static frontend files.

### Backend

After updating the backend:

```bash
sudo systemctl restart reminder
```

Check that it started successfully:

```bash
systemctl status reminder
```

### Chromium Dashboard

To restart the kiosk/dashboard without rebooting the Raspberry Pi:

```bash
pkill chromium
/home/jakegillespie06/start-reminder-kiosk.sh
```

### Full System

To test the complete automatic startup process:

```bash
sudo reboot
```

After rebooting, the Raspberry Pi should automatically start the backend and frontend, rotate the display, start motion sensing, wait for the web application to become available, and open the Reminder dashboard in Chromium kiosk mode.
