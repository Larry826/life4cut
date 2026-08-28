# Direct BLE Printing

This project includes an experimental direct Bluetooth printing path for the OAZ Life4Cut booth.

## Runtime Requirement

- Direct printing requires an iPad browser that supports Web Bluetooth, such as Bluefy.
- Safari on iPad does not support direct BLE printing.
- The production site should be opened over HTTPS.
- The booth operator must select and authorize the Bluetooth printer before public use.

## Booth Setup Flow

1. Open the site with `?printerSetup=1`.
2. Check that Web Bluetooth support is shown as available.
3. Press `PPS1 프린터 찾기`.
4. Select the actual PPS1 printer in the system chooser.
5. Choose the print width and density.
6. Keep the test raster write mode on `Without response (현재 방식)` unless running the controlled Bluefy experiment.
7. Press `테스트 인쇄`.
8. After the test paper physically prints, press `정상 출력됨`.
9. Keep the page open during booth operation.

The operator panel also provides a diagnostic-only `전체 BLE 장치 보기` fallback. The normal search filters devices by the `PPS1_` name prefix and keeps the `ff00` service as an optional service.

## Confirmed PPS1 Transport

JADX analysis of the official Luck Jingle Android APK confirmed these PPS1 transport details:

- Service: `0000ff00-0000-1000-8000-00805f9b34fb`
- General notify: `0000ff01-0000-1000-8000-00805f9b34fb`
- Credit/MTU notify: `0000ff03-0000-1000-8000-00805f9b34fb`
- Write characteristic: select the `WRITE_WITHOUT_RESPONSE` characteristic inside `ff00`; keep `ff02` as a fallback
- Default packet size: `20 bytes`; valid `ff03` requested packet sizes from `20` to `512` bytes become the active packet size
- Android FastBle sends each split packet only after the Android GATT write callback reports success.
- The actual `ff02` characteristic currently reports both `write` and `writeWithoutResponse`, and Bluefy exposes both `writeValueWithResponse` and `writeValueWithoutResponse`.
- Android's default write type remains no-response when `PROPERTY_WRITE_NO_RESPONSE` exists and Luck Jingle/FastBle does not call `setWriteType()`, so the official app is expected to use no-response writes while still pacing each split packet through Android GATT write callbacks.
- PPS1 normal image compression: `isCompress = false`
- Image format: uncompressed ESC/POS `GS v 0`
- Official normal print ending sends `setMarkPrintLast`: `1B BB BB`
- `stopPrintJobLuck` is not a fire-and-forget write; it waits on `ff01` for an ACK

The `ff03` notification controls write flow:

- `[01 NN]`: add `NN` writable BLE packets of credit
- `[02 LL HH]`: printer-requested payload size, used as the active Web Bluetooth write size when it is within `20..512`

Web Bluetooth does not expose Android's `requestMtu` API, so the app cannot explicitly negotiate MTU like the Android SDK. For PPS1 validation, the app now uses the requested payload size directly when it is in range. The observed PPS1 requested size is `200` bytes, and the next Bluefy test is to confirm whether `writeValueWithoutResponse` accepts that `200` byte packet.

The official PPS1 normal print order observed from the Luck Jingle Android SDK is:

- Enable printer: `10 FF F1 03`
- Wake printer: twelve `00` bytes
- Send bitmap: uncompressed ESC/POS `GS v 0`
- Feed end line dots: `1B 4A [dots]`
- Mark last page: `1B BB BB`
- Stop job: `10 FF F1 45`
- Wait up to `70` seconds for an `ff01` ACK whose first byte is `AA` or whose decoded text starts with `OK`

The stop ACK waiter is armed before sending `10 FF F1 45`, so a fast `ff01` ACK cannot be missed. Other `ff01` packets continue through the normal status/diagnostic handling and are not treated as stop ACKs.

## Current Safety Policy

The public result screen does not run the long final-image BLE print path by default.

`PPS1_LONG_PRINT_EXPERIMENTAL` is currently `false`, so pressing `인쇄하기` shows:

`직접 인쇄 프로토콜을 확인 중이에요. 관리자에게 알려 주세요.`

Short operator test printing remains available because it has already completed successfully on the actual PPS1 printer. QR download and the original PNG result flow remain independent fallback paths.

## Refresh And Reconnect

The booth is intended to keep the page open. While the page stays open, the authorized BluetoothDevice reference remains available to the app even if the printer disconnects after a print job.

Some PPS1 printers disconnect after receiving a print job. This is handled as an expected booth flow for short test printing:

`connect -> test print -> disconnect -> reconnect from operator panel`

If the page is refreshed, the setup page tries to use `navigator.bluetooth.getDevices()` when the browser supports it. This can reconnect only to a device that was previously authorized by the operator. If `getDevices()` is not supported or no matching device is available, the operator should reopen `?printerSetup=1` and press `PPS1 프린터 찾기` again.

## PPS1 Field Test Result

Observed on iPad + Bluefy + PPS1:

- BLE name `PPS1_113E` is visible from mobile Bluetooth/BLE scanning.
- `ff00` service, `ff01` notify, and `ff02` write characteristics connect successfully.
- The short test print completes successfully.
- A real final Life4Cut image starts printing with the correct content.
- During a long continuous final image print, the printer powered off and BLE disconnected.
- Battery was about 52%, and the printer did not appear meaningfully overheated.
- The official Luck Jingle app can print the same long photo successfully.
- In a later short test, the `OAZ / PRINT TEST` bitmap printed completely, then the printer powered off and disconnected about `3` seconds later.
- The last `ff01` packet was `4F 4B` (`OK`), while the saved stop ACK state was still `idle`.
- In `20` byte mode, the trace stopped during `raster:start` after `320 / 6152` bytes and `16 / 308` packets, then the PPS1 powered off/disconnected about `5` seconds after the last `ff03`.
- The same PPS1 sent requested packet size `200` bytes over `ff03`.
- Follow-up tests with both `20` byte and `200` byte Web Bluetooth packet sizes stopped after exactly `16` packets, so the next investigation is focused on Web Bluetooth write completion semantics.
- A controlled operator-only A/B test now allows sending only the short test raster with `writeValueWithResponse` while keeping command writes on the existing path.
- The `With response 200B` test reached `2 / 31` packets and then failed a `200` byte with-response write without credit starvation, so the next test uses `With response 20B pacing` to stay within the default ATT payload size.
- The next diagnostic goal is to confirm the exact print phase immediately before the disconnect.

Because the official app can print the same long photo, the next priority is confirming the PPS1-specific LuckPrinter SDK print flow rather than continuing to tune battery, heat, speed, or delay values by guesswork.

## Credit-Based Write Flow

All BLE writes now use the PPS1 credit transport:

- Start `ff01` notifications for normal responses and status
- Start `ff03` notifications for credit and requested payload size
- Split every command/image byte array into the active packet size
- Wait for positive credit before writing packets
- Treat one credit as permission for one active-size Web Bluetooth write packet
- If current credit is `3` or higher, reserve `1` credit for the current batch
- Subtract successfully written packet count from current credit
- Abort immediately if the BLE session changes or disconnects
- Fail with a clear timeout if no new credit arrives within `30` seconds
- If an `ff03` requested packet-size write fails, do not fall back to `20` byte writes inside the same job; stop and show the packet-size write error in diagnostics

The previous fixed-delay transport, based on `100` byte chunks plus `50 ms` chunk delay and `500/900 ms` band pauses, was not the official PPS1 flow and is no longer the active sender.

## Short Test Raster Write Modes

The operator panel provides three modes for the short OAZ / PRINT TEST raster only:

- `Without response (현재 방식)`: command and raster writes use the existing no-response-first path.
- `With response 200B (기존 실험)`: command writes stay unchanged, while raster packets use `writeValueWithResponse` at the session active packet size, usually `200` bytes after `ff03`.
- `With response 20B pacing (신규 실험)`: command writes stay unchanged, while raster packets use `writeValueWithResponse` with a separate test raster effective packet size of `20` bytes.

The `20B pacing` mode does not change the session active packet size or the saved `ff03` requested packet size. It exists only to compare Bluefy's Promise resolution pacing with Android FastBle's GATT write-callback pacing. It is not treated as a confirmed official PPS1 protocol change.

## Locked Long Print Flow

The long final-image path remains locked while `PPS1_LONG_PRINT_EXPERIMENTAL` is `false`. If manually enabled for a controlled hardware test later, the intended byte sequence is:

- Preflight battery query: `10 FF 50 F1`
- Preflight status query: `10 FF 40`
- Enable printer: `10 FF F1 03`
- Wake printer: twelve `00` bytes
- Set density: `10 FF 10 00 [n]`
- Send one uncompressed ESC/POS `GS v 0` raster command over credit-controlled active-size writes
- Final feed: `1B 4A 50`
- Mark last page: `1B BB BB`
- Stop job: `10 FF F1 45`
- Wait for `ff01` stop ACK: first byte `AA` or decoded text starting with `OK`, timeout `70` seconds

This still requires iPad + Bluefy + PPS1 validation before being exposed to booth users.

## Current Profile

Default profile:

- Profile ID: `luckprinter-normal-384`
- Print width: `384 px`
- Optional width: `576 px`
- Density: `0`, `1`, or `2`
- Default density: `0`
- Feed dots: `80`
- BLE packet size: `20 bytes` by default, or a valid `ff03` requested size such as `200 bytes`
- Chunk delay: `0 ms`; flow is controlled by `ff03` credit notifications
- Raster format: uncompressed ESC/POS `GS v 0`

## Read-Only Diagnostics

The operator panel may query public read-only LuckPrinter commands when a device responds:

- Model: `10 FF 20 F0`
- Firmware version: `10 FF 20 F1`
- Serial number presence: `10 FF 20 F2`
- Boot info presence: `10 FF 20 EF`
- Printer info presence: `10 FF 70`
- Status: `10 FF 40`
- Battery: `10 FF 50 F1`
- Credit notify connected state: `ff03`
- Current credit
- Requested packet size
- Active packet size
- Active packet size source: `FF03 requested` or `default 20`
- Last Web Bluetooth write size
- Current short-test raster write mode
- Test raster effective packet size
- Last raster write mode
- Last with-response packet write duration
- Average and max with-response packet write duration
- With-response packet success count
- With-response write error state and message
- Selected write characteristic UUID
- Selected write characteristic `write`, `writeWithoutResponse`, `read`, `notify`, and `indicate` properties
- Presence of the `writeValueWithResponse` and `writeValueWithoutResponse` Web Bluetooth APIs
- Packet-size write error state and message
- Printer-requested packet size from `[02 LL HH]`
- Last `ff03` notification hex
- Credit wait timeout state
- Last session credit, last `ff03` packet, requested packet size, and disconnect-event time
- Last `ff01` notification hex
- Stop ACK state, ACK packet hex, and ACK duration in milliseconds
- Last print trace phase, completed phase, write packet preview, credit-wait state, raster progress, and receive/disconnect timestamps

Only model, firmware, and transport diagnostics are displayed in the operator UI. Full serial numbers are not shown in the normal UI.

## Physical Output Trace Diagnostic

The current PPS1 short-test investigation found that `With response 20B pacing`
can show only `1 / 308` JavaScript-resolved raster packets while the actual
paper output still reaches `OAZ` and `PRINT TEST`. The final bottom black line
was missing before the printer powered off and disconnected.

The operator diagnostics now need to compare the physical paper against a
unique test job id, A/B/C/D y-position markers, per-packet attempted/resolved/
rejected write trace, and recent `ff01`/`ff03` events. This is a diagnostic
step only; it does not change the PPS1 sender algorithm or unlock long final
image printing.

After changing BLE write packets to independent `Uint8Array` instances, short
test job `T5960` reached `6152 / 6152` bytes and `308 / 308` resolved packets,
received `OK` for the stop ACK, and did not power off or disconnect. The
operator-only final-image experiment now reuses that validated transport for
the raster payload: `20` byte packets, `writeValueWithResponse`, one resolved
Promise before the next packet, `ff03` credit flow, and `ff01` stop ACK. Guest
long direct printing remains locked while `PPS1_LONG_PRINT_EXPERIMENTAL` is
`false`.

## Printer Test Record

- Printer model:
- Firmware version:
- Working print width:
- Working density:
- Test date:
- Notes:

## Protocol Reference

Protocol behavior was implemented from the public reverse-engineered LuckPrinter BLE protocol reference:

- https://github.com/ChiaraCannolee/thermal-pocket-printer-basic
- https://github.com/ChiaraCannolee/thermal-pocket-printer-basic/blob/main/PROTOCOL.md

Only the minimal command sequence needed for normal uncompressed raster test printing and read-only diagnostics is used. Firmware update, factory reset, persistent printer settings, guessed proprietary compression, and unsupported commands are intentionally not implemented.
