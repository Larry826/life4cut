# PPS1 Protocol Investigation

## Summary

The actual PPS1 printer is discoverable as `PPS1_113E`, connects through the LuckPrinter-style BLE service `ff00`, and accepts the `ff01` notify and `ff02` write characteristics. A short test print succeeds. A long Life4Cut final image starts with correct content but the printer powers off and BLE disconnects after only the first part of the image.

JADX analysis of the official Luck Jingle Android APK confirmed that PPS1 uses uncompressed `GS v 0` raster image data with `isCompress = false`, but the transport must be controlled by `ff03` credit notifications. The previous fixed-delay transport was not the official PPS1 flow.

## Confirmed On Actual Hardware

- Device name prefix: `PPS1_`
- Observed device name: `PPS1_113E`
- BLE service: `0000ff00-0000-1000-8000-00805f9b34fb`
- Notify characteristic: `0000ff01-0000-1000-8000-00805f9b34fb`
- Write characteristic: `0000ff02-0000-1000-8000-00805f9b34fb`
- Short OAZ test print: successful
- Long final-image print: starts correctly, then printer powers off and BLE disconnects
- Battery during the failed long test: about `52%`
- Heat during the failed long test: little or no meaningful heat observed
- Official Luck Jingle app: prints the same long photo successfully
- Later short test observation: the `OAZ / PRINT TEST` bitmap printed fully, then the printer powered off and disconnected about `3` seconds later.
- Later short test diagnostics: last `ff03` was `01 01`, last `ff01` was `4F 4B` (`OK`), and saved stop ACK state was still `idle`.
- Later `20` byte transport trace: raster stopped at `320 / 6152` bytes and `16 / 308` packets, then PPS1 powered off/disconnected about `5` seconds after the last `ff03`.
- The PPS1 requested packet size was `200 bytes`, so the next validation checks whether Bluefy supports a `200` byte `writeValueWithoutResponse`.
- Follow-up tests showed both `20` byte and `200` byte Web Bluetooth writes reached exactly `16` packets before credit starvation and power-off/disconnect.
- Actual `ff02` diagnostics showed both `write` and `writeWithoutResponse` properties, and Bluefy exposed both `writeValueWithResponse` and `writeValueWithoutResponse`.
- The `With response 200B` test wrote `2` packets, reached `400 / 6152` raster bytes, then failed a `200` byte with-response write while credit was still available.
- Next diagnostic goal: identify the exact print phase immediately before the disconnect.

## Confirmed From Official Luck Jingle Android APK

- PPS1 BLE service: `0000ff00-0000-1000-8000-00805f9b34fb`
- Normal notify characteristic: `0000ff01-0000-1000-8000-00805f9b34fb`
- Credit/MTU notify characteristic: `0000ff03-0000-1000-8000-00805f9b34fb`
- Official SDK does not hardcode only `ff02` as the write characteristic
- Official SDK selects a characteristic inside `ff00` with `WRITE_WITHOUT_RESPONSE`
- The current PPS1 device may still expose `ff02`, so `ff02` remains a fallback
- Android `BluetoothGattCharacteristic` defaults to `WRITE_TYPE_NO_RESPONSE` when `PROPERTY_WRITE_NO_RESPONSE` is present, and Luck Jingle/FastBle does not call `setWriteType()`, so the official app is expected to use no-response writes on this `ff02`.
- PPS1 image compression flag: `isCompress = false`
- PPS1 normal image payload: uncompressed ESC/POS `GS v 0`
- Official SDK default `onePackSize`: `20 bytes`
- `ff03` credit response `[01 NN]`: add `NN` writable BLE packets
- `ff03` payload-size response `[02 LL HH]`: printer requested payload size `LL | (HH << 8)`
- Actual PPS1 requested packet size observed over `ff03`: `200 bytes`
- Official SDK treats one credit as one negotiated-payload-size packet, not always one `20` byte packet
- Official PPS1 final-page marker: `setMarkPrintLast` sends `1B BB BB`
- `stopPrintJobLuck` arms an `ff01` response waiter before writing `10 FF F1 45`
- `stopPrintJobLuck` waits up to `70` seconds for an ACK whose first byte is `AA` or whose decoded text starts with `OK`
- Android FastBle sends each split packet only after the Android GATT write callback reports success, so the remaining unknown is Bluefy/Web Bluetooth write-completion pacing semantics.

Android SDK code can request MTU using Android APIs, but Web Bluetooth does not expose `requestMtu`. The Web Bluetooth implementation uses a valid requested packet size from `ff03` as the active write size and records whether Bluefy accepts that write size. Values outside `20..512` fall back to the default `20` byte packet size.

The confirmed official PPS1 normal print order is:

- `enablePrinterLuck()`: `10 FF F1 03`
- `printerWakeupLuck()`: twelve `00` bytes
- `sendBitmap(bitmap)`: uncompressed ESC/POS `GS v 0`
- `printLineDotsLuck(getEndLineDot())`: `1B 4A [dots]`
- `setMarkPrintLast()`: `1B BB BB`
- `stopPrintJobLuck()`: `10 FF F1 45`
- `ff01` stop ACK wait: first byte `AA` or decoded text starting with `OK`, timeout `70` seconds

## Public Source Reviewed

- Repository: https://github.com/ChiaraCannolee/thermal-pocket-printer-basic
- Protocol notes: https://github.com/ChiaraCannolee/thermal-pocket-printer-basic/blob/main/PROTOCOL.md
- Python reference implementation: https://github.com/ChiaraCannolee/thermal-pocket-printer-basic/blob/main/print.py

The public protocol document is for `C&Co 3128 / DP-L1S`. It states that the protocol was reverse-engineered from the decompiled Lucky Jingle APK package `com.dingdang.newprint` and verified against DP-L1S hardware.

## What Is Confirmed From The Public DP-L1S Source

- LuckPrinter SDK package family: `com.luckprinter.sdk_new`
- Base class lineage includes `BaseDevice`, `BaseNormalDevice`, and `BaseLujiangNormalDevice`
- The documented hardware is `DP-L1S`, not PPS1
- `DP_L1S` settings listed in the public document:
  - `printWidth = 384`
  - `compress = true`
  - `compressWay = 0`
  - `endLineDot = 80`
  - `enablePrinterMode = 3`
- Normal BLE service and characteristics:
  - Service `ff00`
  - Notify `ff01`
  - Write `ff02`
- Read-only device info commands:
  - `10 FF 20 F0` model
  - `10 FF 20 F1` firmware version
  - `10 FF 20 F2` serial number
  - `10 FF 20 EF` boot info
  - `10 FF 70` printer info
  - `10 FF 50 F1` battery
  - `10 FF 40` status
- Normal uncompressed print sequence:
  - Enable printer: `10 FF F1 03`
  - Wake printer: twelve `00` bytes
  - Image data: uncompressed ESC/POS `GS v 0`
  - Feed paper: `1B 4A 50`
  - Stop job: `10 FF F1 45`

## What Is Not Yet Confirmed For PPS1

The public source references the LuckPrinter family and lists class names such as `MiniPocketPrinter`, `PPD1`, and `PPS1`, but this investigation did not find a public PPS1-specific class implementation or PPS1-specific field values.

The following PPS1 details are not confirmed:

- PPS1 exact `printWidth`
- PPS1 `compressWay`
- PPS1 `endLineDot`
- PPS1 `enablePrinterMode`
- Whether PPS1 requires additional page/session/paper commands before long image data
- Whether PPS1 needs additional ACK waits beyond the confirmed `ff03` credit transport

## Current life4cut Byte Flow

### Device Discovery

Normal operator discovery uses:

- `navigator.bluetooth.requestDevice`
- `filters: [{ namePrefix: "PPS1_" }]`
- `optionalServices: ["0000ff00-0000-1000-8000-00805f9b34fb"]`

The diagnostic fallback button `전체 BLE 장치 보기` is the only path that uses `acceptAllDevices: true`.

### Connection

- Connect to selected device GATT
- Get primary service `ff00`
- Select the first `WRITE_WITHOUT_RESPONSE` characteristic inside `ff00`
- Fall back to `ff02` if characteristic enumeration does not provide a writable-without-response target
- Get notify characteristic `ff01`
- Get credit notify characteristic `ff03`
- Start notifications
- Reset credit to `0`
- Query read-only diagnostics when available

### Short Test Print

Short test print remains enabled:

- Status query: `10 FF 40`
- Enable printer: `10 FF F1 03`
- Wake printer: twelve `00` bytes
- Set density: `10 FF 10 00 [n]`
- Send one uncompressed ESC/POS `GS v 0` raster command
- Use active-size writes gated by `ff03` credit
- Feed: `1B 4A 50`
- Mark last page: `1B BB BB`
- Stop: `10 FF F1 45`
- Wait for `ff01` stop ACK: `AA` or `OK`, timeout `70` seconds

### Long Final Image Print

Long final image print is now locked by default through:

`PPS1_LONG_PRINT_EXPERIMENTAL = false`

If this flag were manually enabled later, the current experimental flow would be:

- Battery query: `10 FF 50 F1`
- Status query: `10 FF 40`
- Enable printer: `10 FF F1 03`
- Wake printer: twelve `00` bytes
- Set density: `10 FF 10 00 [n]`
- Send one uncompressed ESC/POS `GS v 0` raster command
- Split writes into the active packet size
- Wait for `ff03` credit before each packet batch
- Treat one credit as one active-size Web Bluetooth write packet
- Reserve `1` credit for the current batch when current credit is `3` or higher
- Abort if the session disconnects or if no credit arrives within `30` seconds
- Feed: `1B 4A 50`
- Mark last page: `1B BB BB`
- Stop: `10 FF F1 45`
- Wait for `ff01` stop ACK before treating the job as complete

This is still locked until iPad + Bluefy + PPS1 validation is performed.

## Previous Fixed-Delay Flow

The previous implementation used `100` byte chunks, `50 ms` chunk delay, `96` row bands, and `500/900 ms` band pauses. That was an experimental workaround based on DP-L1S-compatible `GS v 0` output. It was not the official PPS1 transport flow.

## Compressed `1F 10` Format

The public DP-L1S protocol notes say the LuckPrinter SDK supports a compressed image format with header `1F 10`, using native SDK methods named `Compress.codeESC()` and `Compress.codeLihu()` from `libcompress.so`.

The official PPS1 APK analysis confirmed `isCompress = false` for PPS1 normal image printing, so the current implementation must keep uncompressed `GS v 0` raster output and must not implement guessed `1F 10` compression.

## Current App Decision

- Keep short operator test printing enabled.
- Keep QR download and original final PNG generation enabled.
- Keep the BLE connection, model query, firmware query, status query, battery query, and `ff03` credit diagnostics available in the operator panel.
- Keep `ff01` diagnostics for the last packet and `stopPrintJobLuck` ACK status/duration visible in the operator panel.
- Keep the last print trace visible after disconnect so the operator can identify the exact phase that was active before power-off.
- Use credit-controlled active-size Web Bluetooth writes. Default to `20` bytes, but use the valid `ff03` requested size, currently observed as `200` bytes, for PPS1 short-test validation.
- If Bluefy rejects a requested-size write, stop the print attempt and record a packet-size write error instead of silently falling back to `20` byte writes.
- Show the selected write characteristic capabilities in the operator panel to compare `write` and `writeWithoutResponse` support against Web Bluetooth API availability.
- Add an operator-only short-test raster write mode switch for A/B validation: commands still use the normal write path, while the short test raster can be sent with `writeValueWithResponse`.
- Treat the with-response raster mode as a Bluefy write-completion semantics experiment, not as a confirmed official PPS1 protocol change.
- Keep the default test mode on `Without response (현재 방식)`, keep the previous `With response 200B` experiment, and add `With response 20B pacing` to test Android-like callback pacing within the default ATT payload size.
- Do not run the long final-image BLE print path in the guest result screen by default.
- Show the user-facing message: `직접 인쇄 프로토콜을 확인 중이에요. 관리자에게 알려 주세요.`

## Physical Output Trace Diagnostic

The latest `With response 20B pacing` test reported only `1 / 308` raster
packets resolved in JavaScript, but the paper physically showed both `OAZ`
and `PRINT TEST`. The bottom black line did not print before the printer
powered off and disconnected.

That means Web Bluetooth Promise resolution progress may not match physical
printer receive progress. The next validation adds a unique short test job id,
physical A/B/C/D y markers in the bitmap, per-packet attempted/resolved/rejected
write trace, and recent `ff01`/`ff03` event history so the paper output can be
matched to the active JavaScript session and byte offsets.

After fixing the BLE packet backing-buffer issue so every Web Bluetooth write
receives an independent `Uint8Array`, short test job `T5960` completed normally:
`6152 / 6152` bytes, `308 / 308` resolved packets, `OK` stop ACK, and no
power-off/disconnect. The validated transport is now available only for the
operator long-print experiment: final images are rasterized normally, then the
raster payload is sent as `20` byte independent packets with
`writeValueWithResponse`, `ff03` credit flow, and `ff01` stop ACK.

## Next Investigation Steps

1. Open `?printerSetup=1` on the actual iPad + Bluefy + PPS1 environment.
2. Connect the `PPS1_` printer and confirm that `FF03 notify` shows `연결됨`.
3. Check that current credit increases from `[01 NN]` notifications.
4. Check whether `[02 LL HH]` appears and record the requested packet size.
5. Run only the short `테스트 인쇄` first and confirm that the active packet size becomes `200` when requested by `ff03`.
6. If `200` byte writes fail in Bluefy, capture the packet-size write error from the operator panel.
7. Record whether the selected write characteristic exposes `write` and/or `writeWithoutResponse`, plus whether Bluefy exposes `writeValueWithResponse` and `writeValueWithoutResponse`.
8. Run the short test with `Without response (현재 방식)`, then repeat with `With response 20B pacing (신규 실험)` and compare whether it passes the previous `16 / 308` packet stop point.
9. Keep `PPS1_LONG_PRINT_EXPERIMENTAL=false` until a controlled long-print test is explicitly approved.
10. If the short test fails with credit timeout, compare the observed FF03 log and write-completion behavior with the Android SDK flow before changing print payloads.

## Required Conclusion

Luck Jingle 앱에서는 같은 PPS1 프린터가 긴 이미지를 정상 출력하므로, 현재 문제를 프린터 배터리나 발열 문제로 계속 조정하기보다 PPS1용 official SDK print flow를 확인하는 것이 다음 우선순위다. 현재는 그중 `ff03` credit flow control이 확인되어 Web Bluetooth transport에 반영되었고, 긴 네컷 직접 인쇄는 iPad 실기기 검증 전까지 잠근다.
