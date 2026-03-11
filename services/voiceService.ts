import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';

class VoiceService {
  private recording: Audio.Recording | null = null;
  private isSpeaking = false;

  // ─── Recording ─────────────────────────────────────────────────────────────

  async startRecording(): Promise<void> {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    this.recording = recording;
  }

  async stopRecording(): Promise<string | null> {
    if (!this.recording) return null;

    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI();
    this.recording = null;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    return uri ?? null;
  }

  async cancelRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.stopAndUnloadAsync();
      this.recording = null;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  }

  isRecording(): boolean {
    return this.recording !== null;
  }

  // ─── Transcription via Open WebUI Whisper endpoint ─────────────────────────

  async transcribe(audioUri: string, serverUrl: string, token: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'voice.m4a',
    } as unknown as Blob);
    formData.append('model', 'whisper-1');

    const response = await fetch(`${serverUrl}/api/v1/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error('Transcription failed');
    const data = await response.json();
    return data.text ?? '';
  }

  // ─── TTS ───────────────────────────────────────────────────────────────────

  async speak(text: string, onDone?: () => void): Promise<void> {
    this.isSpeaking = true;
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 0.95,
      onDone: () => {
        this.isSpeaking = false;
        onDone?.();
      },
      onStopped: () => {
        this.isSpeaking = false;
      },
      onError: () => {
        this.isSpeaking = false;
      },
    });
  }

  async stopSpeaking(): Promise<void> {
    await Speech.stop();
    this.isSpeaking = false;
  }

  getSpeakingState(): boolean {
    return this.isSpeaking;
  }
}

export const voiceService = new VoiceService();
