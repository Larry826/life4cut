import {
  DENSITY_OPTIONS,
  PRINTER_NAME_PREFIX,
  PRINT_WIDTH_OPTIONS,
  TEST_RASTER_WRITE_MODE_OPTIONS,
  TEST_RASTER_WRITE_MODES,
} from '../utils/luckJingleBlePrinter'

const connectionStateLabels = {
  unsupported: '미지원',
  disconnected: '현재 연결 끊김',
  connecting: '연결 중',
  connected: '연결됨',
  printing: '인쇄 중',
  error: '오류',
}

const stopAckStatusLabels = {
  idle: '대기 전',
  waiting: '대기 중',
  success: '성공',
  timeout: 'timeout',
  disconnect: 'disconnect',
}

function formatDiagnosticTime(value) {
  if (!value) {
    return '기록 없음'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function getPrintTraceEvents(trace) {
  return Array.isArray(trace?.events) ? trace.events : []
}

function formatProgressValue(completed, total, unit = '') {
  const completedValue = Number.isFinite(completed) ? completed : 0
  const totalValue = Number.isFinite(total) ? total : 0
  const suffix = unit ? ` ${unit}` : ''

  return `${completedValue} / ${totalValue}${suffix}`
}

function formatWritePacketBuffer(packet) {
  if (!packet || !Number.isFinite(packet.byteLength)) {
    return '기록 없음'
  }

  return `byteLength ${packet.byteLength} / byteOffset ${packet.byteOffset ?? '?'} / buffer ${packet.bufferByteLength ?? '?'}`
}

function formatByteRange(start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 'offset ?'
  }

  return `offset ${start}-${end}`
}

function formatOriginalWriteError(error) {
  if (!error?.occurred) {
    return '없음'
  }

  const message = error.message || 'empty message'
  const packetLabel = Number.isFinite(error.packetSeq) ? `#${error.packetSeq}` : '#?'
  const offsetLabel = formatByteRange(error.byteStart, error.byteEnd)

  return `${error.name || 'Error'} / ${message} / ${error.apiName || 'API ?'} / ${packetLabel} / ${offsetLabel} / ${error.writeMode || 'mode ?'}`
}

function formatRasterWriteEvent(event) {
  const status = event.rejected ? 'rejected' : event.resolved ? 'resolved' : 'attempted'
  const duration = Number.isFinite(event.durationMs) ? ` / ${event.durationMs}ms` : ''
  const error = event.rejected
    ? ` / ${event.errorName || 'Error'}: ${event.errorMessage || 'empty message'}`
    : ''

  return `#${event.seq} ${status} ${formatByteRange(event.byteStart, event.byteEnd)} / ${event.packetLength}B / ${event.apiName || 'API ?'}${duration}${error}`
}

function formatCapabilityValue(value) {
  if (typeof value !== 'boolean') {
    return '확인 전'
  }

  return value ? '예' : '아니오'
}

function formatApiValue(value) {
  if (typeof value !== 'boolean') {
    return '확인 전'
  }

  return value ? '있음' : '없음'
}

function getTestRasterWriteModeLabel(value) {
  return (
    TEST_RASTER_WRITE_MODE_OPTIONS.find((option) => option.value === value)?.label ??
    TEST_RASTER_WRITE_MODE_OPTIONS[0].label
  )
}

function PrinterSetupPanel({
  directPrintSupported,
  longPrintDensityLabel,
  longDirectPrintEnabled,
  minLongPrintBatteryPercent,
  isAwaitingTestPrintConfirmation,
  isDirectPrintVerified,
  printerBatteryPercent,
  printerConnectionState,
  printerDeviceName,
  printerFirmwareVersion,
  printerHealthStatus,
  printerModel,
  printerSettings,
  printerStatusMessage,
  printerTransportDiagnostics,
  onConfirmTestPrint,
  onConnectAnyBleDevice,
  onConnectPrinter,
  onDensityChange,
  onDisconnectPrinter,
  onPrintTest,
  onTestRasterWriteModeChange,
  onPrintWidthChange,
  onRefreshStatus,
}) {
  const isBusy = printerConnectionState === 'connecting' || printerConnectionState === 'printing'
  const isConnected = printerConnectionState === 'connected'
  const hasConfiguredPrinter = Boolean(
    printerDeviceName || printerSettings.deviceId || printerSettings.deviceName,
  )
  const canConnect = directPrintSupported && !isBusy
  const canDisconnect = directPrintSupported && hasConfiguredPrinter && !isBusy
  const canTestPrint = directPrintSupported && hasConfiguredPrinter && !isBusy
  const selectedTestRasterWriteMode = TEST_RASTER_WRITE_MODE_OPTIONS.some(
    (option) => option.value === printerSettings.testRasterWriteMode,
  )
    ? printerSettings.testRasterWriteMode
    : TEST_RASTER_WRITE_MODES.withoutResponse
  const currentTestRasterWriteModeLabel =
    getTestRasterWriteModeLabel(selectedTestRasterWriteMode)
  const connectionDetail =
    printerConnectionState === 'disconnected' && hasConfiguredPrinter
      ? '다음 인쇄 시 자동 재연결'
      : ''
  const batteryLabel = Number.isFinite(printerBatteryPercent)
    ? `${printerBatteryPercent}%`
    : '확인 불가'
  const currentCreditLabel = Number.isFinite(printerTransportDiagnostics?.currentCredit)
    ? printerTransportDiagnostics.currentCredit
    : 0
  const activePacketSize = Number.isFinite(printerTransportDiagnostics?.activePacketSize)
    ? printerTransportDiagnostics.activePacketSize
    : printerTransportDiagnostics?.packetSize
  const activePacketSizeLabel = Number.isFinite(activePacketSize)
    ? `${activePacketSize} bytes`
    : '20 bytes'
  const activePacketSizeSourceLabel =
    printerTransportDiagnostics?.activePacketSizeSource || 'default 20'
  const requestedPacketSizeLabel = Number.isFinite(
    printerTransportDiagnostics?.printerRequestedPacketSize,
  )
    ? `${printerTransportDiagnostics.printerRequestedPacketSize} bytes`
    : '요청 없음'
  const lastWriteSizeLabel = Number.isFinite(printerTransportDiagnostics?.lastWebBluetoothWriteSize)
    ? `${printerTransportDiagnostics.lastWebBluetoothWriteSize} bytes`
    : '기록 없음'
  const lastWritePacketBufferLabel = formatWritePacketBuffer(
    printerTransportDiagnostics?.lastWebBluetoothWritePacket,
  )
  const packetSizeWriteError = printerTransportDiagnostics?.packetSizeWriteError ?? {}
  const packetSizeWriteErrorLabel = packetSizeWriteError.occurred
    ? `${packetSizeWriteError.name || 'Error'}: ${
        packetSizeWriteError.message || 'requested packet size write failed'
      } (${packetSizeWriteError.attemptedSize ?? '?'} bytes${
        packetSizeWriteError.phase ? `, ${packetSizeWriteError.phase}` : ''
      })`
    : '없음'
  const currentWriteCharacteristicCapabilities =
    printerTransportDiagnostics?.writeCharacteristicCapabilities ?? {}
  const lastSessionWriteCharacteristicCapabilities =
    printerTransportDiagnostics?.lastSession?.writeCharacteristicCapabilities ?? {}
  const writeCharacteristicCapabilities =
    currentWriteCharacteristicCapabilities.uuid
      ? currentWriteCharacteristicCapabilities
      : lastSessionWriteCharacteristicCapabilities
  const writeCharacteristicProperties = writeCharacteristicCapabilities.properties ?? {}
  const writeCharacteristicApi = writeCharacteristicCapabilities.api ?? {}
  const writeCharacteristicUuidLabel =
    writeCharacteristicCapabilities.uuid ||
    printerTransportDiagnostics?.writeCharacteristicUuid ||
    '확인 전'
  const writeWithResponseSupportLabel = formatCapabilityValue(
    writeCharacteristicProperties.write,
  )
  const writeWithoutResponseSupportLabel = formatCapabilityValue(
    writeCharacteristicProperties.writeWithoutResponse,
  )
  const writeValueWithResponseApiLabel = formatApiValue(
    writeCharacteristicApi.writeValueWithResponse,
  )
  const writeValueWithoutResponseApiLabel = formatApiValue(
    writeCharacteristicApi.writeValueWithoutResponse,
  )
  const writeReadSupportLabel = formatCapabilityValue(writeCharacteristicProperties.read)
  const writeNotifySupportLabel = formatCapabilityValue(writeCharacteristicProperties.notify)
  const writeIndicateSupportLabel = formatCapabilityValue(writeCharacteristicProperties.indicate)
  const creditLog = Array.isArray(printerTransportDiagnostics?.creditLog)
    ? printerTransportDiagnostics.creditLog
    : []
  const stopAckDiagnostics = printerTransportDiagnostics?.stopAck ?? {}
  const stopAckDurationLabel = Number.isFinite(stopAckDiagnostics.durationMs)
    ? `${stopAckDiagnostics.durationMs} ms`
    : '기록 없음'
  const stopAckStatusLabel = stopAckStatusLabels[stopAckDiagnostics.status] ?? '대기 전'
  const lastSessionDiagnostics = printerTransportDiagnostics?.lastSession ?? {}
  const currentRasterWriteDiagnostics =
    printerTransportDiagnostics?.rasterWriteDiagnostics ?? {}
  const lastSessionRasterWriteDiagnostics =
    lastSessionDiagnostics.rasterWriteDiagnostics ?? {}
  const rasterWriteDiagnostics =
    currentRasterWriteDiagnostics.currentJobId ||
    currentRasterWriteDiagnostics.lastRasterWriteMode
      ? currentRasterWriteDiagnostics
      : lastSessionRasterWriteDiagnostics
  const selectedTestRasterEffectivePacketSize =
    selectedTestRasterWriteMode === TEST_RASTER_WRITE_MODES.withResponse20Pacing
      ? 20
      : activePacketSize
  const testRasterEffectivePacketSize = Number.isFinite(
    rasterWriteDiagnostics.testRasterEffectivePacketSize,
  )
    ? rasterWriteDiagnostics.testRasterEffectivePacketSize
    : selectedTestRasterEffectivePacketSize
  const testRasterEffectivePacketSizeLabel = Number.isFinite(testRasterEffectivePacketSize)
    ? `${testRasterEffectivePacketSize} bytes`
    : '확인 전'
  const lastRasterWriteModeLabel = rasterWriteDiagnostics.lastRasterWriteMode
    ? getTestRasterWriteModeLabel(rasterWriteDiagnostics.lastRasterWriteMode)
    : '기록 없음'
  const lastWithResponseWriteDurationLabel = Number.isFinite(
    rasterWriteDiagnostics.lastWithResponseWriteDurationMs,
  )
    ? `${rasterWriteDiagnostics.lastWithResponseWriteDurationMs} ms`
    : '기록 없음'
  const averageWithResponseWriteDurationLabel = Number.isFinite(
    rasterWriteDiagnostics.withResponseWriteAverageDurationMs,
  )
    ? `${rasterWriteDiagnostics.withResponseWriteAverageDurationMs} ms`
    : '기록 없음'
  const maxWithResponseWriteDurationLabel = Number.isFinite(
    rasterWriteDiagnostics.withResponseWriteMaxDurationMs,
  )
    ? `${rasterWriteDiagnostics.withResponseWriteMaxDurationMs} ms`
    : '기록 없음'
  const withResponseWriteSuccessPacketsLabel = Number.isFinite(
    rasterWriteDiagnostics.withResponseWriteSuccessPackets,
  )
    ? `${rasterWriteDiagnostics.withResponseWriteSuccessPackets} packets`
    : '0 packets'
  const withResponseWriteError = rasterWriteDiagnostics.withResponseWriteError ?? {}
  const withResponseWriteErrorLabel = withResponseWriteError.occurred
    ? `${withResponseWriteError.name || 'Error'}: ${
        withResponseWriteError.message || 'writeValueWithResponse failed'
      }${withResponseWriteError.phase ? ` (${withResponseWriteError.phase})` : ''}`
    : '없음'
  const currentTestJobIdLabel = currentRasterWriteDiagnostics.currentJobId || '기록 없음'
  const lastSessionTestJobIdLabel =
    lastSessionRasterWriteDiagnostics.lastJobId ||
    lastSessionRasterWriteDiagnostics.currentJobId ||
    '기록 없음'
  const markerMetadata = Array.isArray(rasterWriteDiagnostics.markerMetadata)
    ? rasterWriteDiagnostics.markerMetadata
    : []
  const packetEvents = Array.isArray(rasterWriteDiagnostics.packetEvents)
    ? rasterWriteDiagnostics.packetEvents
    : []
  const notificationEvents = Array.isArray(rasterWriteDiagnostics.notificationEvents)
    ? rasterWriteDiagnostics.notificationEvents
    : []
  const rasterWriteCountersLabel = `${rasterWriteDiagnostics.rasterWriteAttemptedPackets ?? 0} attempted / ${rasterWriteDiagnostics.rasterWriteResolvedPackets ?? 0} resolved / ${rasterWriteDiagnostics.rasterWriteRejectedPackets ?? 0} rejected`
  const rasterWriteBytesLabel = `${rasterWriteDiagnostics.rasterWriteAttemptedBytes ?? 0} attempted / ${rasterWriteDiagnostics.rasterWriteResolvedBytes ?? 0} resolved bytes`
  const originalWriteErrorLabel = formatOriginalWriteError(
    rasterWriteDiagnostics.originalWriteError,
  )
  const testPrintInvocationCountLabel =
    rasterWriteDiagnostics.testPrintInvocationCount ?? 0
  const duplicateTestPrintBlockedCountLabel =
    rasterWriteDiagnostics.duplicateTestPrintBlockedCount ?? 0
  const lastSessionStopAckDiagnostics = lastSessionDiagnostics.stopAck ?? {}
  const lastSessionCreditLabel = Number.isFinite(lastSessionDiagnostics.currentCredit)
    ? lastSessionDiagnostics.currentCredit
    : '기록 없음'
  const lastSessionRequestedPacketSizeLabel = Number.isFinite(
    lastSessionDiagnostics.printerRequestedPacketSize,
  )
    ? `${lastSessionDiagnostics.printerRequestedPacketSize} bytes`
    : '기록 없음'
  const lastSessionActivePacketSizeLabel = Number.isFinite(lastSessionDiagnostics.activePacketSize)
    ? `${lastSessionDiagnostics.activePacketSize} bytes`
    : '기록 없음'
  const lastSessionLastWriteSizeLabel = Number.isFinite(
    lastSessionDiagnostics.lastWebBluetoothWriteSize,
  )
    ? `${lastSessionDiagnostics.lastWebBluetoothWriteSize} bytes`
    : '기록 없음'
  const lastSessionWritePacketBufferLabel = formatWritePacketBuffer(
    lastSessionDiagnostics.lastWebBluetoothWritePacket,
  )
  const lastSessionPacketSizeWriteError = lastSessionDiagnostics.packetSizeWriteError ?? {}
  const lastSessionPacketSizeWriteErrorLabel = lastSessionPacketSizeWriteError.occurred
    ? `${lastSessionPacketSizeWriteError.name || 'Error'}: ${
        lastSessionPacketSizeWriteError.message || 'requested packet size write failed'
      } (${lastSessionPacketSizeWriteError.attemptedSize ?? '?'} bytes${
        lastSessionPacketSizeWriteError.phase
          ? `, ${lastSessionPacketSizeWriteError.phase}`
          : ''
      })`
    : '없음'
  const lastSessionStopAckDurationLabel = Number.isFinite(
    lastSessionStopAckDiagnostics.durationMs,
  )
    ? `${lastSessionStopAckDiagnostics.durationMs} ms`
    : '기록 없음'
  const lastSessionStopAckStatusLabel =
    stopAckStatusLabels[lastSessionStopAckDiagnostics.status] ?? '대기 전'
  const lastSessionDisconnectedAtLabel = formatDiagnosticTime(
    lastSessionDiagnostics.disconnectedAt,
  )
  const currentPrintTrace = printerTransportDiagnostics?.printTrace ?? {}
  const currentPrintTraceEvents = getPrintTraceEvents(currentPrintTrace)
  const lastSessionPrintTrace = lastSessionDiagnostics.printTrace ?? {}
  const lastSessionPrintTraceEvents = getPrintTraceEvents(lastSessionPrintTrace)
  const printTrace =
    currentPrintTraceEvents.length > 0 ? currentPrintTrace : lastSessionPrintTrace
  const printTraceEvents =
    currentPrintTraceEvents.length > 0 ? currentPrintTraceEvents : lastSessionPrintTraceEvents
  const rasterBytesLabel = formatProgressValue(
    printTrace.rasterCompletedBytes,
    printTrace.rasterTotalBytes,
    'bytes',
  )
  const rasterPacketsLabel = formatProgressValue(
    printTrace.rasterCompletedPackets,
    printTrace.rasterTotalPackets,
    'packets',
  )

  return (
    <aside className="printer-setup-panel" aria-labelledby="printer-setup-title">
      <div className="printer-setup-heading">
        <p className="printer-setup-eyebrow">운영자 설정</p>
        <h2 id="printer-setup-title">Bluetooth 프린터 설정</h2>
        <p>
          직접 인쇄를 사용하려면 Bluetooth 인쇄를 지원하는 부스 브라우저가 필요해요.
        </p>
      </div>

      <div className="printer-status-grid" aria-live="polite">
        <div>
          <span>지원 여부</span>
          <strong>{directPrintSupported ? '지원됨' : '미지원'}</strong>
        </div>
        <div>
          <span>연결 상태</span>
          <strong>
            {isConnected ? '연결됨' : connectionStateLabels[printerConnectionState] ?? '확인 중'}
          </strong>
          {connectionDetail && <small>{connectionDetail}</small>}
        </div>
        <div>
          <span>프린터</span>
          <strong>{printerDeviceName || '선택 안 됨'}</strong>
        </div>
        <div>
          <span>호환성</span>
          <strong>{isDirectPrintVerified ? '테스트 완료' : '테스트 필요'}</strong>
        </div>
        <div>
          <span>배터리</span>
          <strong>{batteryLabel}</strong>
        </div>
        <div>
          <span>상태</span>
          <strong>{printerHealthStatus}</strong>
        </div>
        <div>
          <span>모델명</span>
          <strong>{printerModel || '응답 대기 중'}</strong>
        </div>
        <div>
          <span>펌웨어</span>
          <strong>{printerFirmwareVersion || '응답 대기 중'}</strong>
        </div>
      </div>

      {printerStatusMessage && (
        <p className="printer-status-message" role={printerConnectionState === 'error' ? 'alert' : 'status'}>
          {printerStatusMessage}
        </p>
      )}

      <div className="printer-setup-actions">
        <div className="printer-discovery-action">
          <button
            className="button button-primary"
            disabled={!canConnect}
            type="button"
            onClick={() => onConnectPrinter()}
          >
            {printerConnectionState === 'connecting' ? '프린터 검색 중...' : 'PPS1 프린터 찾기'}
          </button>
          <p className="printer-discovery-note">
            {PRINTER_NAME_PREFIX}로 시작하는 프린터만 검색해요.
          </p>
        </div>
        <button
          className="button button-secondary"
          disabled={!canDisconnect}
          type="button"
          onClick={onDisconnectPrinter}
        >
          연결 해제
        </button>
      </div>

      <button
        className="button button-secondary"
        disabled={!canTestPrint}
        type="button"
        onClick={onRefreshStatus}
      >
        {printerConnectionState === 'connecting' ? '상태 확인 중...' : '상태 새로고침'}
      </button>

      <button
        className="printer-discovery-fallback-button"
        disabled={!canConnect}
        type="button"
        onClick={onConnectAnyBleDevice}
      >
        전체 BLE 장치 보기
      </button>

      <fieldset className="printer-setting-fieldset">
        <legend>인쇄 폭</legend>
        <div className="printer-choice-group">
          {PRINT_WIDTH_OPTIONS.map((printWidth) => (
            <label className="printer-choice" key={printWidth}>
              <input
                checked={printerSettings.printWidth === printWidth}
                name="print-width"
                type="radio"
                value={printWidth}
                onChange={() => onPrintWidthChange(printWidth)}
              />
              <span>{printWidth} px</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="printer-setting-fieldset">
        <legend>농도</legend>
        <div className="printer-choice-group">
          {DENSITY_OPTIONS.map((densityOption) => (
            <label className="printer-choice" key={densityOption.value}>
              <input
                checked={printerSettings.density === densityOption.value}
                name="print-density"
                type="radio"
                value={densityOption.value}
                onChange={() => onDensityChange(densityOption.value)}
              />
              <span>{densityOption.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="printer-setting-fieldset">
        <legend>테스트 raster write mode</legend>
        <div className="printer-choice-group">
          {TEST_RASTER_WRITE_MODE_OPTIONS.map((writeModeOption) => (
            <label className="printer-choice" key={writeModeOption.value}>
              <input
                checked={selectedTestRasterWriteMode === writeModeOption.value}
                name="test-raster-write-mode"
                type="radio"
                value={writeModeOption.value}
                onChange={() => onTestRasterWriteModeChange(writeModeOption.value)}
              />
              <span>{writeModeOption.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="printer-safe-mode" aria-label="긴 사진 직접 인쇄 설정">
        <p className="printer-safe-mode-title">긴 사진 직접 인쇄</p>
        <dl>
          <div>
            <dt>현재 상태</dt>
            <dd>{longDirectPrintEnabled ? '실험적 활성화' : '프로토콜 확인 전 잠금'}</dd>
          </div>
          <div>
            <dt>이미지 형식</dt>
            <dd>비압축 GS v 0</dd>
          </div>
          <div>
            <dt>전송 방식</dt>
            <dd>FF03 credit</dd>
          </div>
          <div>
            <dt>사진 농도</dt>
            <dd>{longPrintDensityLabel}</dd>
          </div>
          <div>
            <dt>인쇄 시작 배터리</dt>
            <dd>{minLongPrintBatteryPercent}% 이상</dd>
          </div>
        </dl>
      </div>

      <div className="printer-safe-mode" aria-label="PPS1 credit transport 진단">
        <p className="printer-safe-mode-title">PPS1 credit transport</p>
        <dl>
          <div>
            <dt>FF03 notify</dt>
            <dd>{printerTransportDiagnostics?.creditNotifyConnected ? '연결됨' : '미연결'}</dd>
          </div>
          <div>
            <dt>현재 credit</dt>
            <dd>{currentCreditLabel}</dd>
          </div>
          <div>
            <dt>session active packet size</dt>
            <dd>{activePacketSizeLabel}</dd>
          </div>
          <div>
            <dt>packet size source</dt>
            <dd>{activePacketSizeSourceLabel}</dd>
          </div>
          <div>
            <dt>요청 packet size</dt>
            <dd>{requestedPacketSizeLabel}</dd>
          </div>
          <div>
            <dt>마지막 write size</dt>
            <dd>{lastWriteSizeLabel}</dd>
          </div>
          <div>
            <dt>마지막 write packet buffer</dt>
            <dd>{lastWritePacketBufferLabel}</dd>
          </div>
          <div>
            <dt>현재 test raster write mode</dt>
            <dd>{currentTestRasterWriteModeLabel}</dd>
          </div>
          <div>
            <dt>current test job id</dt>
            <dd>{currentTestJobIdLabel}</dd>
          </div>
          <div>
            <dt>last session test job id</dt>
            <dd>{lastSessionTestJobIdLabel}</dd>
          </div>
          <div>
            <dt>test print invocations</dt>
            <dd>{testPrintInvocationCountLabel}</dd>
          </div>
          <div>
            <dt>duplicate tests blocked</dt>
            <dd>{duplicateTestPrintBlockedCountLabel}</dd>
          </div>
          <div>
            <dt>test raster effective packet size</dt>
            <dd>{testRasterEffectivePacketSizeLabel}</dd>
          </div>
          <div>
            <dt>raster write counters</dt>
            <dd>{rasterWriteCountersLabel}</dd>
          </div>
          <div>
            <dt>raster write bytes</dt>
            <dd>{rasterWriteBytesLabel}</dd>
          </div>
          <div>
            <dt>마지막 raster write mode</dt>
            <dd>{lastRasterWriteModeLabel}</dd>
          </div>
          <div>
            <dt>마지막 with-response write 시간</dt>
            <dd>{lastWithResponseWriteDurationLabel}</dd>
          </div>
          <div>
            <dt>평균 with-response write 시간</dt>
            <dd>{averageWithResponseWriteDurationLabel}</dd>
          </div>
          <div>
            <dt>최대 with-response write 시간</dt>
            <dd>{maxWithResponseWriteDurationLabel}</dd>
          </div>
          <div>
            <dt>with-response 성공 packet</dt>
            <dd>{withResponseWriteSuccessPacketsLabel}</dd>
          </div>
          <div>
            <dt>with-response write error</dt>
            <dd>{withResponseWriteErrorLabel}</dd>
          </div>
          <div>
            <dt>write characteristic UUID</dt>
            <dd>{writeCharacteristicUuidLabel}</dd>
          </div>
          <div>
            <dt>write with response 지원</dt>
            <dd>{writeWithResponseSupportLabel}</dd>
          </div>
          <div>
            <dt>write without response 지원</dt>
            <dd>{writeWithoutResponseSupportLabel}</dd>
          </div>
          <div>
            <dt>writeValueWithResponse API</dt>
            <dd>{writeValueWithResponseApiLabel}</dd>
          </div>
          <div>
            <dt>writeValueWithoutResponse API</dt>
            <dd>{writeValueWithoutResponseApiLabel}</dd>
          </div>
          <div>
            <dt>write characteristic read</dt>
            <dd>{writeReadSupportLabel}</dd>
          </div>
          <div>
            <dt>write characteristic notify</dt>
            <dd>{writeNotifySupportLabel}</dd>
          </div>
          <div>
            <dt>write characteristic indicate</dt>
            <dd>{writeIndicateSupportLabel}</dd>
          </div>
          <div>
            <dt>packet write error</dt>
            <dd>{packetSizeWriteErrorLabel}</dd>
          </div>
          <div>
            <dt>original write error</dt>
            <dd>{originalWriteErrorLabel}</dd>
          </div>
          <div>
            <dt>마지막 FF03</dt>
            <dd>{printerTransportDiagnostics?.lastCreditNotificationHex || '수신 없음'}</dd>
          </div>
          <div>
            <dt>credit timeout</dt>
            <dd>{printerTransportDiagnostics?.creditWaitTimedOut ? '발생함' : '없음'}</dd>
          </div>
          <div>
            <dt>마지막 FF01</dt>
            <dd>{printerTransportDiagnostics?.lastNotificationHex || '수신 없음'}</dd>
          </div>
          <div>
            <dt>stop ACK 상태</dt>
            <dd>{stopAckStatusLabel}</dd>
          </div>
          <div>
            <dt>stop ACK packet</dt>
            <dd>{stopAckDiagnostics.packetHex || '수신 없음'}</dd>
          </div>
          <div>
            <dt>stop ACK 시간</dt>
            <dd>{stopAckDurationLabel}</dd>
          </div>
          <div>
            <dt>마지막 세션 credit</dt>
            <dd>{lastSessionCreditLabel}</dd>
          </div>
          <div>
            <dt>마지막 세션 FF03</dt>
            <dd>{lastSessionDiagnostics.lastCreditNotificationHex || '기록 없음'}</dd>
          </div>
          <div>
            <dt>마지막 세션 FF01</dt>
            <dd>{lastSessionDiagnostics.lastNotificationHex || '기록 없음'}</dd>
          </div>
          <div>
            <dt>마지막 요청 packet</dt>
            <dd>{lastSessionRequestedPacketSizeLabel}</dd>
          </div>
          <div>
            <dt>마지막 active packet</dt>
            <dd>
              {lastSessionActivePacketSizeLabel}
              {lastSessionDiagnostics.activePacketSizeSource
                ? ` / ${lastSessionDiagnostics.activePacketSizeSource}`
                : ''}
            </dd>
          </div>
          <div>
            <dt>마지막 write size</dt>
            <dd>{lastSessionLastWriteSizeLabel}</dd>
          </div>
          <div>
            <dt>마지막 write packet buffer</dt>
            <dd>{lastSessionWritePacketBufferLabel}</dd>
          </div>
          <div>
            <dt>마지막 packet error</dt>
            <dd>{lastSessionPacketSizeWriteErrorLabel}</dd>
          </div>
          <div>
            <dt>마지막 stop ACK</dt>
            <dd>
              {lastSessionStopAckStatusLabel}
              {lastSessionStopAckDiagnostics.packetHex
                ? ` / ${lastSessionStopAckDiagnostics.packetHex}`
                : ''}
              {lastSessionStopAckDurationLabel !== '기록 없음'
                ? ` / ${lastSessionStopAckDurationLabel}`
                : ''}
            </dd>
          </div>
          <div>
            <dt>disconnect event</dt>
            <dd>
              {lastSessionDiagnostics.disconnectEventOccurred
                ? `발생 (${lastSessionDisconnectedAtLabel})`
                : '기록 없음'}
            </dd>
          </div>
        </dl>

        {creditLog.length > 0 && (
          <ol className="printer-credit-log" aria-label="최근 FF03 credit 로그">
            {creditLog.map((creditEvent, index) => (
              <li key={`${creditEvent.rawHex}-${index}`}>
                <span>{creditEvent.rawHex || 'hex 없음'}</span>
                <small>
                  +{creditEvent.addedCredit ?? 0} / total {creditEvent.totalCredit ?? 0}
                </small>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="printer-safe-mode" aria-label="마지막 인쇄 trace">
        <p className="printer-safe-mode-title">마지막 인쇄 trace</p>
        <dl>
          <div>
            <dt>현재 phase</dt>
            <dd>{printTrace.currentPhase || '기록 없음'}</dd>
          </div>
          <div>
            <dt>마지막 완료 phase</dt>
            <dd>{printTrace.lastCompletedPhase || '기록 없음'}</dd>
          </div>
          <div>
            <dt>마지막 write packet</dt>
            <dd>{printTrace.lastWritePacketHex || '기록 없음'}</dd>
          </div>
          <div>
            <dt>대기 중인 다음 packet</dt>
            <dd>{printTrace.pendingWritePreviewHex || '기록 없음'}</dd>
          </div>
          <div>
            <dt>credit wait</dt>
            <dd>{printTrace.creditWaitInProgress ? '대기 중' : '아님'}</dd>
          </div>
          <div>
            <dt>credit wait phase</dt>
            <dd>{printTrace.creditWaitPhase || '기록 없음'}</dd>
          </div>
          <div>
            <dt>credit wait 시작</dt>
            <dd>{formatDiagnosticTime(printTrace.creditWaitStartedAt)}</dd>
          </div>
          <div>
            <dt>raster bytes</dt>
            <dd>{rasterBytesLabel}</dd>
          </div>
          <div>
            <dt>raster packets</dt>
            <dd>{rasterPacketsLabel}</dd>
          </div>
          <div>
            <dt>마지막 FF03 시각</dt>
            <dd>{formatDiagnosticTime(printTrace.lastCreditNotificationAt)}</dd>
          </div>
          <div>
            <dt>마지막 FF01 시각</dt>
            <dd>{formatDiagnosticTime(printTrace.lastNotificationAt)}</dd>
          </div>
          <div>
            <dt>disconnect 시각</dt>
            <dd>{formatDiagnosticTime(printTrace.disconnectAt || lastSessionDiagnostics.disconnectedAt)}</dd>
          </div>
        </dl>

        {printTraceEvents.length > 0 && (
          <ol className="printer-credit-log" aria-label="최근 print trace phase">
            {printTraceEvents.map((traceEvent, index) => (
              <li key={`${traceEvent.phase}-${traceEvent.at}-${index}`}>
                <span>{traceEvent.phase}</span>
                <small>{formatDiagnosticTime(traceEvent.at)}</small>
              </li>
            ))}
          </ol>
        )}

        {markerMetadata.length > 0 && (
          <details className="printer-diagnostic-details">
            <summary>Raster physical markers</summary>
            <ol className="printer-credit-log">
              {markerMetadata.map((marker) => (
                <li key={marker.name}>
                  <span>
                    {marker.name}: y {marker.y}, byte {marker.byteOffset}, packet{' '}
                    {marker.packetIndex}
                  </span>
                  <small>rowBytes {rasterWriteDiagnostics.rasterRowBytes || '?'}</small>
                </li>
              ))}
            </ol>
          </details>
        )}

        {packetEvents.length > 0 && (
          <details className="printer-diagnostic-details">
            <summary>Recent raster write events</summary>
            <ol className="printer-credit-log">
              {packetEvents.slice(0, 24).map((packetEvent) => (
                <li key={`${packetEvent.jobId}-${packetEvent.seq}`}>
                  <span>{formatRasterWriteEvent(packetEvent)}</span>
                  <small>
                    {packetEvent.jobId || 'job ?'} / {formatDiagnosticTime(packetEvent.attemptedAt)}
                    {packetEvent.firstBytesHex ? ` / ${packetEvent.firstBytesHex}` : ''}
                  </small>
                </li>
              ))}
            </ol>
          </details>
        )}

        {notificationEvents.length > 0 && (
          <details className="printer-diagnostic-details">
            <summary>Recent FF01 / FF03 events</summary>
            <ol className="printer-credit-log">
              {notificationEvents.slice(0, 24).map((notificationEvent, index) => (
                <li
                  key={`${notificationEvent.characteristic}-${notificationEvent.at}-${index}`}
                >
                  <span>
                    {notificationEvent.characteristic}: {notificationEvent.packetHex || 'hex 없음'}
                  </span>
                  <small>
                    {formatDiagnosticTime(notificationEvent.at)} /{' '}
                    {notificationEvent.phase || 'phase 없음'} / attempted{' '}
                    {notificationEvent.rasterWriteAttemptedPackets ?? 0} / resolved{' '}
                    {notificationEvent.rasterWriteResolvedPackets ?? 0} / credit{' '}
                    {notificationEvent.currentCredit ?? 0}
                  </small>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>

      <div className="printer-test-area">
        <button
          className="button button-secondary"
          disabled={!canTestPrint}
          type="button"
          onClick={onPrintTest}
        >
          {printerConnectionState === 'printing' ? '테스트 인쇄 중...' : '테스트 인쇄'}
        </button>

        {isAwaitingTestPrintConfirmation && (
          <div className="printer-test-confirmation" role="status">
            <p>테스트 용지가 실제로 출력됐나요?</p>
            <button className="button button-primary" type="button" onClick={onConfirmTestPrint}>
              정상 출력됨
            </button>
          </div>
        )}

        <p className={`printer-verified-status ${isDirectPrintVerified ? 'is-verified' : ''}`}>
          {isDirectPrintVerified
            ? '테스트 출력 확인 완료'
            : longDirectPrintEnabled
              ? '테스트 출력 확인 후 결과 화면에서 직접 인쇄가 활성화돼요.'
              : '테스트 출력은 운영자 확인용이며 긴 사진 인쇄는 프로토콜 확인 후 열릴 예정이에요.'}
        </p>
      </div>
    </aside>
  )
}

export default PrinterSetupPanel
