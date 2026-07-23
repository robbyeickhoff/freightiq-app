# Investigate Mac Freeze Before Resuming FreightIQ Website Work

**Captured:** 2026-07-23T13:54:04Z

**Timezone:** UTC

**Status:** Unreviewed

**Classification:** Unassigned

**Destination:** Unassigned

## Original Thought

Field Note: Investigate Mac freeze before resuming FreightIQ website work

When I get home, do not restart the local development server immediately.

Run these checks first:

1. Restart the Mac normally.

2. Confirm available storage:
   - Apple menu → System Settings → General → Storage
   - Record how much free space remains.
   - Flag anything below roughly 20 GB free.

3. Open Activity Monitor and check:
   - Memory Pressure
   - CPU usage
   - Any unusually heavy processes
   - Look specifically for:
     - node
     - next
     - Chrome
     - Chromium
     - Playwright
     - browser helper processes

4. In Terminal, check for leftover development and browser processes:

   ps aux | grep -E "next|node|chromium|chrome|playwright" | grep -v grep

5. Check whether the local server port is still occupied:

   lsof -i :3000

6. Check current memory usage:

   top -o mem

   Press q to exit.

7. Check current CPU usage:

   top -o cpu

   Press q to exit.

8. Review available disk space in Terminal:

   df -h /

9. Check battery condition:
   - Apple menu → System Settings → Battery → Battery Health
   - Record the reported condition and maximum capacity.

10. Check for recent crashes or kernel panics:
    - Open Console
    - Look under Crash Reports and System Reports
    - Search for:
      - panic
      - watchdog
      - WindowServer
      - node
      - Chrome
      - Chromium

11. Run Apple Diagnostics:
    - Shut down the Mac.
    - Disconnect unnecessary external devices.
    - Apple silicon Mac: hold the power button until startup options appear, then press Command-D.
    - Intel Mac: turn it on and immediately hold D.
    - Record any reference codes shown.

12. Confirm the FreightIQ repository working tree before resuming work:

    cd /Users/robbyeickhoff/mfi
    git status --short
    git branch --show-current

13. Before reopening the REA page:
    - Start only the local server.
    - Use the normal browser manually.
    - Do not launch browser automation.
    - Watch Activity Monitor while the page loads.
    - Record any Terminal errors, CPU spike, memory-pressure increase, or repeated reload behavior.

Do not commit, push, deploy, or change website files while investigating the freeze.

## What Triggered It

Problems with the Mac this morning before resuming FreightIQ website work.

## Context to Preserve

Do not restart the local development server or modify website files until the diagnostic checks are complete.

---

## Review Outcome

Not yet reviewed.
