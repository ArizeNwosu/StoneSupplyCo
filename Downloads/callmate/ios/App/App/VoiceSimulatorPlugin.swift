import Foundation
import Capacitor
import AVFoundation
import Speech

@objc(VoiceSimulatorPlugin)
public class VoiceSimulatorPlugin: CAPPlugin, CAPBridgedPlugin, AVSpeechSynthesizerDelegate {
    public let identifier = "VoiceSimulatorPlugin"
    public let jsName = "VoiceSimulatorPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "prepareAudioSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deactivateAudioSession", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startRecognition", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopRecognition", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopSpeaking", returnType: CAPPluginReturnPromise),
    ]
    private let audioEngine = AVAudioEngine()
    private let synthesizer = AVSpeechSynthesizer()
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var latestTranscript = ""
    private var latestPartialTranscript = ""
    private var finalizeWorkItem: DispatchWorkItem?
    private var isStoppingRecognition = false
    private let silenceFinalizeDelay: TimeInterval = 1.0

    override public func load() {
        synthesizer.delegate = self
    }

    @objc func prepareAudioSession(_ call: CAPPluginCall) {
        do {
            try configureAudioSession(active: true)
            call.resolve(["available": speechRecognizer != nil])
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func deactivateAudioSession(_ call: CAPPluginCall) {
        stopRecognitionInternal()
        synthesizer.stopSpeaking(at: .immediate)

        do {
            try AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
            call.resolve()
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func startRecognition(_ call: CAPPluginCall) {
        requestPermissions { [weak self] granted, message in
            guard let self else { return }
            guard granted else {
                DispatchQueue.main.async {
                    self.notifyListeners("speechState", data: [
                        "state": "error",
                        "message": message ?? "Speech permission denied",
                    ])
                    call.reject(message ?? "Speech permission denied")
                }
                return
            }

            DispatchQueue.main.async {
                do {
                    try self.configureAudioSession(active: true)
                    try self.startRecognitionInternal()
                    self.notifyListeners("speechState", data: ["state": "listening"])
                    call.resolve(["started": true])
                } catch {
                    self.notifyListeners("speechState", data: [
                        "state": "error",
                        "message": error.localizedDescription,
                    ])
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    @objc func stopRecognition(_ call: CAPPluginCall) {
        stopRecognitionInternal()
        notifyListeners("speechState", data: ["state": "stopped"])
        call.resolve(["transcript": latestTranscript])
    }

    @objc func speak(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            call.reject("Missing text")
            return
        }

        do {
            try configureAudioSession(active: true)
            let utterance = AVSpeechUtterance(string: text)
            utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
            utterance.rate = Float(call.getDouble("rate") ?? 0.45)
            utterance.pitchMultiplier = Float(call.getDouble("pitch") ?? 0.96)
            utterance.postUtteranceDelay = 0.04
            synthesizer.stopSpeaking(at: .immediate)
            synthesizer.speak(utterance)
            call.resolve()
        } catch {
            call.reject(error.localizedDescription)
        }
    }

    @objc func stopSpeaking(_ call: CAPPluginCall) {
        synthesizer.stopSpeaking(at: .immediate)
        notifyListeners("ttsState", data: ["state": "cancelled"])
        call.resolve()
    }

    private func requestPermissions(completion: @escaping (Bool, String?) -> Void) {
        AVAudioSession.sharedInstance().requestRecordPermission { microphoneGranted in
            guard microphoneGranted else {
                completion(false, "Microphone access is required for simulated calls.")
                return
            }

            SFSpeechRecognizer.requestAuthorization { status in
                switch status {
                case .authorized:
                    completion(true, nil)
                case .denied:
                    completion(false, "Speech recognition access is denied in iOS Settings.")
                case .restricted:
                    completion(false, "Speech recognition is restricted on this device.")
                case .notDetermined:
                    completion(false, "Speech recognition permission is still pending.")
                @unknown default:
                    completion(false, "Speech recognition is unavailable.")
                }
            }
        }
    }

    private func configureAudioSession(active: Bool) throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth, .allowBluetoothA2DP])
        try session.setPreferredSampleRate(44_100)
        try session.setPreferredIOBufferDuration(0.005)
        try session.setActive(active, options: [.notifyOthersOnDeactivation])
    }

    private func startRecognitionInternal() throws {
        stopRecognitionInternal()
        latestTranscript = ""
        latestPartialTranscript = ""
        isStoppingRecognition = false
        finalizeWorkItem?.cancel()
        finalizeWorkItem = nil

        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            throw NSError(domain: "VoiceSimulatorPlugin", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Speech recognition is unavailable right now.",
            ])
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        if #available(iOS 13.0, *) {
            request.requiresOnDeviceRecognition = false
        }
        recognitionRequest = request

        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self else { return }

            if let result {
                let transcript = result.bestTranscription.formattedString.trimmingCharacters(in: .whitespacesAndNewlines)
                if !transcript.isEmpty {
                    self.latestPartialTranscript = transcript
                    self.notifyListeners("speechPartial", data: [
                        "transcript": transcript,
                        "isFinal": result.isFinal,
                    ])
                    self.scheduleTranscriptFinalization()
                }

                if result.isFinal {
                    self.finalizeRecognitionTranscript(transcript)
                    return
                }
            }

            if let error {
                if self.isStoppingRecognition {
                    return
                }
                self.stopRecognitionInternal()
                self.notifyListeners("speechState", data: [
                    "state": "error",
                    "message": error.localizedDescription,
                ])
            }
        }
    }

    private func scheduleTranscriptFinalization() {
        finalizeWorkItem?.cancel()
        let workItem = DispatchWorkItem { [weak self] in
            guard let self else { return }
            let transcript = self.latestPartialTranscript.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !transcript.isEmpty else { return }
            self.finalizeRecognitionTranscript(transcript)
        }
        finalizeWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + silenceFinalizeDelay, execute: workItem)
    }

    private func finalizeRecognitionTranscript(_ transcript: String) {
        let cleaned = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleaned.isEmpty else { return }
        finalizeWorkItem?.cancel()
        finalizeWorkItem = nil
        latestTranscript = cleaned
        latestPartialTranscript = cleaned
        notifyListeners("speechFinal", data: ["transcript": cleaned])
        stopRecognitionInternal()
        notifyListeners("speechState", data: ["state": "stopped"])
    }

    private func stopRecognitionInternal() {
        finalizeWorkItem?.cancel()
        finalizeWorkItem = nil
        isStoppingRecognition = true
        if audioEngine.isRunning {
            audioEngine.stop()
        }

        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil
        DispatchQueue.main.async { [weak self] in
            self?.isStoppingRecognition = false
        }
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        notifyListeners("ttsState", data: ["state": "started"])
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        notifyListeners("ttsState", data: ["state": "finished"])
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        notifyListeners("ttsState", data: ["state": "cancelled"])
    }
}
