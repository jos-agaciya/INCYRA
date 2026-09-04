/**
 * INCYRA - Real Agora RTC Web SDK & Live Speech Recognition Integration Service
 * Uses agora-rtc-sdk-ng for real-time audio voice room communication,
 * and live speech recognition to route live speech to the AI incident pipeline.
 */

import AgoraRTC from 'agora-rtc-sdk-ng';

/**
 * Transforms brand names like INCYRA into phonetic equivalents for natural browser TTS pronunciation ("in-SIGH-ruh")
 * without altering visible text, logs, or UI strings.
 * @param {string} text
 * @returns {string} Phonetically adjusted text for SpeechSynthesisUtterance
 */
export function formatTextForSpeechSynthesis(text) {
  if (!text || typeof text !== 'string') return '';
  // Phonetic replacement for INCYRA to ensure it is pronounced "in-SIGH-ruh" rather than spelled letter-by-letter
  return text.replace(/\bINCYRA\b/gi, 'In-syrah');
}

class AgoraVoiceService {
  constructor() {
    this.client = null;
    this.localAudioTrack = null;
    this.isConnected = false;
    this.isMuted = false;
    this.channelName = null;
    this.localUid = null;
    this.knownAgentUid = 1001;
    this.remoteUsers = new Map();

    // Speech Recognition Instance
    this.recognition = null;
    this.isSpeechRecognitionActive = false;

    // Callback listeners
    this.connectionStateListeners = new Set();
    this.participantListeners = new Set();
    this.volumeIndicatorListeners = new Set();
    this.transcriptListeners = new Set();

    // Global audio autoplay protection handler
    try {
      AgoraRTC.onAudioAutoplayFailed = () => {
        console.warn('[RTC] Browser autoplay prevented audio playback until user interaction occurs.');
      };
    } catch {
      // Ignored if unsupported in certain environments
    }
  }

  /**
   * Set the expected Agent RTC UID from backend configuration
   * @param {number|string} uid
   */
  setKnownAgentUid(uid) {
    if (uid) {
      this.knownAgentUid = Number(uid);
    }
  }

  /**
   * Subscribe to connection state changes
   * @param {Function} callback (state: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING') => void
   * @returns {Function} unsubscribe function
   */
  handleConnectionState(callback) {
    this.connectionStateListeners.add(callback);
    callback(this.isConnected ? 'CONNECTED' : 'DISCONNECTED');
    return () => this.connectionStateListeners.delete(callback);
  }

  /**
   * Subscribe to remote participant updates
   * @param {Function} callback (participants: Array) => void
   * @returns {Function} unsubscribe function
   */
  handleParticipantUpdate(callback) {
    this.participantListeners.add(callback);
    callback(this.getParticipants());
    return () => this.participantListeners.delete(callback);
  }

  /**
   * Subscribe to audio volume indicators for active speaker detection
   * @param {Function} callback ({ uid, level, isSpeaking }) => void
   */
  handleVolumeIndicator(callback) {
    this.volumeIndicatorListeners.add(callback);
    return () => this.volumeIndicatorListeners.delete(callback);
  }

  /**
   * Subscribe to live transcripts (from speech recognition or Agora datastream)
   * @param {Function} callback ({ speaker, text, timestamp }) => void
   * @returns {Function} unsubscribe function
   */
  handleTranscript(callback) {
    this.transcriptListeners.add(callback);
    return () => this.transcriptListeners.delete(callback);
  }

  /**
   * Get formatted list of actual active RTC participants in the channel
   */
  getParticipants() {
    const list = [];

    // Local user (if connected)
    if (this.isConnected && this.localUid) {
      list.push({
        id: `local-${this.localUid}`,
        uid: this.localUid,
        name: 'You (Incident Commander)',
        initials: 'YOU',
        role: 'Incident Commander',
        isLocal: true,
        isAI: false,
        isActive: true,
        isSpeaking: false,
      });
    }

    // Remote users
    for (const [uid, user] of this.remoteUsers) {
      const isAgent =
        (this.knownAgentUid && Number(uid) === Number(this.knownAgentUid)) ||
        Number(uid) === 1001 ||
        String(uid).includes('1001') ||
        String(uid).includes('999999');

      const name = isAgent ? 'INCYRA AI' : `Participant (${uid})`;
      const role = isAgent ? 'AI Incident Commander' : 'Incident Responder';
      const initials = isAgent ? 'AI' : `U${String(uid).slice(-2)}`;

      list.push({
        id: `remote-${uid}`,
        uid,
        name,
        initials,
        role,
        isLocal: false,
        isAI: isAgent,
        isActive: true,
        isSpeaking: false,
      });
    }

    return list;
  }

  /**
   * Join live incident voice room with Agora RTC Web SDK
   * @param {Object} options
   * @param {string} options.appId Agora App ID
   * @param {string} options.channelName Channel name
   * @param {string} options.token Dynamic RTC token from backend
   * @param {number|string} options.uid Client UID
   */
  async joinChannel({ appId, channelName, token, uid }) {
    try {
      if (this.isConnected) {
        await this.leaveChannel();
      }

      this._notifyConnectionState('CONNECTING');
      this.channelName = channelName;

      // Initialize Agora RTC Client
      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      // Setup event handlers before join
      this._bindClientEvents();

      // Join Agora RTC channel
      console.log(`[RTC] Joining channel: "${channelName}" with UID: ${uid || 'auto'}...`);
      const assignedUid = await this.client.join(appId, channelName, token || null, uid || null);
      this.localUid = assignedUid;
      console.log(`[RTC] browser joined with UID: ${assignedUid}`);

      // Create and publish local microphone audio track
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true, // Acoustic Echo Cancellation
        ANS: true, // Automatic Noise Suppression
        AGC: true, // Auto Gain Control
      });

      await this.client.publish([this.localAudioTrack]);
      console.log(`[RTC] microphone published`);

      // Enable volume indicator for active speaker detection
      this.client.enableAudioVolumeIndicator();

      this.isConnected = true;
      this.isMuted = false;
      this._notifyConnectionState('CONNECTED');
      this._notifyParticipants(this.getParticipants());

      // Start live speech recognition for voice-to-incident intelligence pipeline
      this._startSpeechRecognition();

      return {
        success: true,
        channel: channelName,
        uid: assignedUid,
        message: 'Connected to Agora RTC incident voice room',
      };
    } catch (error) {
      console.error(`[RTC] Join channel error:`, error);
      this._cleanupTracks();
      this.isConnected = false;
      this._notifyConnectionState('DISCONNECTED');
      throw new Error(`Failed to join voice room: ${error.message}`);
    }
  }

  /**
   * Leave live incident voice room
   */
  async leaveChannel() {
    try {
      this._stopSpeechRecognition();
      this._cleanupTracks();

      if (this.client) {
        console.log(`[RTC] Leaving channel: "${this.channelName}"`);
        await this.client.leave();
        this.client.removeAllListeners();
        this.client = null;
      }

      this.remoteUsers.clear();
      this.isConnected = false;
      this.isMuted = false;
      this.localUid = null;
      this.channelName = null;

      this._notifyConnectionState('DISCONNECTED');
      this._notifyParticipants([]);
      return { success: true };
    } catch (error) {
      console.error(`[RTC] Leave channel error:`, error);
      throw new Error(`Failed to leave voice room: ${error.message}`);
    }
  }

  /**
   * Mute / Unmute local microphone using Agora local track
   * @param {boolean} [shouldMute]
   */
  async muteMicrophone(shouldMute) {
    this.isMuted = shouldMute !== undefined ? shouldMute : !this.isMuted;

    if (this.localAudioTrack) {
      await this.localAudioTrack.setEnabled(!this.isMuted);
      console.log(`[RTC] Microphone ${this.isMuted ? 'muted' : 'unmuted'}`);
    }

    return { isMuted: this.isMuted };
  }

  /**
   * Setup internal Agora RTC event listeners
   * @private
   */
  _bindClientEvents() {
    if (!this.client) return;

    // Remote user joined channel
    this.client.on('user-joined', (user) => {
      const isAgent =
        (this.knownAgentUid && Number(user.uid) === Number(this.knownAgentUid)) ||
        Number(user.uid) === 1001;
      if (isAgent) {
        console.log(`[RTC] remote agent joined (UID=${user.uid})`);
      } else {
        console.log(`[RTC] remote user joined channel: UID=${user.uid}`);
      }
      this.remoteUsers.set(user.uid, user);
      this._notifyParticipants(this.getParticipants());
    });

    // Remote user published audio/video
    this.client.on('user-published', async (user, mediaType) => {
      try {
        const isAgent =
          (this.knownAgentUid && Number(user.uid) === Number(this.knownAgentUid)) ||
          Number(user.uid) === 1001;

        if (isAgent) {
          console.log(`[REAL AGORA AUDIO] Remote AI agent published audio track (UID=${user.uid})`);
        } else {
          console.log(`[RTC] remote user published: UID=${user.uid}, mediaType=${mediaType}`);
        }

        await this.client.subscribe(user, mediaType);

        if (isAgent && mediaType === 'audio') {
          console.log(`[REAL AGORA AUDIO] AI audio track subscribed successfully for agent UID: ${user.uid}`);
          if (user.audioTrack) {
            console.log(`[REAL AGORA AUDIO] Playing remote AI audio for UID: ${user.uid}`);
            try {
              user.audioTrack.play();
              this.isAgoraAgentAudioActive = true;
            } catch (playErr) {
              console.warn(`[REAL AGORA AUDIO] Error playing remote audio track:`, playErr.message);
            }
          }
        } else if (mediaType === 'audio' && user.audioTrack) {
          console.log(`[RTC] audio playback started for UID=${user.uid}`);
          try {
            user.audioTrack.play();
          } catch (playErr) {
            console.warn(`[RTC] Note on audioTrack.play():`, playErr.message);
          }
        }
        this.remoteUsers.set(user.uid, user);
        this._notifyParticipants(this.getParticipants());
      } catch (err) {
        console.error(`[RTC] Error subscribing to remote user UID=${user.uid}:`, err);
      }
    });

    // Remote user unpublished
    this.client.on('user-unpublished', (user, mediaType) => {
      console.log(`[RTC] remote user unpublished: UID=${user.uid}, mediaType=${mediaType}`);
      const isAgent =
        (this.knownAgentUid && Number(user.uid) === Number(this.knownAgentUid)) ||
        Number(user.uid) === 1001;

      if (isAgent && mediaType === 'audio') {
        this.isAgoraAgentAudioActive = false;
        console.log(`[REAL AGORA AUDIO] Remote AI agent stopped publishing audio track.`);
      }

      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.stop();
      }
      this._notifyParticipants(this.getParticipants());
    });

    // Remote user left channel
    this.client.on('user-left', (user, reason) => {
      console.log(`[RTC] remote user left channel: UID=${user.uid}, reason=${reason}`);
      const isAgent =
        (this.knownAgentUid && Number(user.uid) === Number(this.knownAgentUid)) ||
        Number(user.uid) === 1001;
      if (isAgent) {
        this.isAgoraAgentAudioActive = false;
      }
      this.remoteUsers.delete(user.uid);
      this._notifyParticipants(this.getParticipants());
    });

    // Agora Stream Messages (Subtitles / Transcriptions sent by Agora agent over RTC datastream)
    this.client.on('stream-message', (uid, stream) => {
      try {
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(stream);
        try {
          const parsed = JSON.parse(text);

          // Handle Agent state transitions (listening, thinking, silent, speaking)
          if (parsed.state) {
            console.log(`[RTC AGENT STATE] UID=${uid} transitioned to: ${parsed.state}`);
            if (parsed.state === 'speaking') {
              console.log('[AGORA AGENT] Speaking state detected');
            }
            const isSpeakingState = parsed.state === 'speaking';
            this._notifySpeaking(uid, isSpeakingState);
            return; // Do not treat agent state control frames as user transcripts!
          }

          if (parsed.error) {
            console.warn(`[AGORA AGENT ERROR] UID=${uid}:`, parsed.error);
            return;
          }

          const transcriptText = parsed.text || parsed.transcript || parsed.words || parsed.message;
          if (transcriptText && typeof transcriptText === 'string' && transcriptText.trim().length > 0) {
            const speakerName =
              Number(uid) === 1001 || uid === this.knownAgentUid ? 'INCYRA AI' : `Participant (${uid})`;
            console.log(`[RTC DATASTREAM TRANSCRIPT] UID=${uid}: "${transcriptText.trim()}"`);
            this._notifyTranscript({
              speaker: speakerName,
              text: transcriptText.trim(),
              timestamp: new Date().toISOString().substring(11, 16),
            });
          }
        } catch {
          // Non-JSON control packet; ignore
        }
      } catch (streamErr) {
        console.warn(`[RTC DATASTREAM] Error decoding stream message:`, streamErr);
      }
    });

    // Connection state changes
    this.client.on('connection-state-change', (curState, prevState, reason) => {
      console.log(`[RTC] Connection state changed: ${prevState} -> ${curState} (reason: ${reason})`);
      const stateMap = {
        DISCONNECTED: 'DISCONNECTED',
        CONNECTING: 'CONNECTING',
        CONNECTED: 'CONNECTED',
        RECONNECTING: 'RECONNECTING',
      };
      const mapped = stateMap[curState] || 'DISCONNECTED';
      this.isConnected = mapped === 'CONNECTED';
      this._notifyConnectionState(mapped);
    });

    // Audio volume indicator for speech detection
    this.client.on('volume-indicator', (volumes) => {
      for (const vol of volumes) {
        const isSpeaking = vol.level > 10;
        this._notifySpeaking(vol.uid, isSpeaking, vol.level);
      }
    });
  }

  /**
   * Play AI Voice Response:
   * Uses real Agora AI audio track if active, or explicitly labelled local browser speech synthesis fallback.
   * @param {string} text - Response text to speak
   */
  playAIVoiceResponse(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) return;

    const cleanText = text.trim();

    if (this.isAgoraAgentAudioActive) {
      console.log(`[REAL AGORA AUDIO] Real Agora AI audio track is active in channel; skipping local fallback.`);
      return;
    }

    console.log(`[LOCAL TTS FALLBACK] Using browser speech synthesis because real Agora AI audio is unavailable`);
    console.log(`[LOCAL TTS FALLBACK] Text: "${cleanText}"`);

    const agentUid = this.knownAgentUid || 1001;
    this._notifySpeaking(agentUid, true, 80);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech

      // Apply TTS-safe phonetic transformation so INCYRA sounds like "in-SIGH-ruh"
      const ttsSafeText = formatTextForSpeechSynthesis(cleanText);
      const utterance = new SpeechSynthesisUtterance(ttsSafeText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Female') ||
            v.name.includes('Samantha') ||
            v.name.includes('Google UK English Female') ||
            v.name.includes('Natural') ||
            v.name.includes('Victoria'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        console.log(`[LOCAL TTS FALLBACK] Browser speech synthesis completed`);
        this._notifySpeaking(agentUid, false, 0);
      };

      utterance.onerror = (e) => {
        console.warn(`[LOCAL TTS FALLBACK] Browser speech synthesis error:`, e.error);
        this._notifySpeaking(agentUid, false, 0);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        console.log(`[LOCAL TTS FALLBACK] Browser speech synthesis timer finished`);
        this._notifySpeaking(agentUid, false, 0);
      }, 4000);
    }
  }

  /**
   * Start browser SpeechRecognition while connected to the voice room
   * @private
   */
  _startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log('[SPEECH] Browser SpeechRecognition API not supported. Live speech will rely on RTC datastreams / API ingestion.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        if (this.isMuted) return; // Do not transcribe when muted

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const transcript = result[0].transcript.trim();
            if (transcript.length > 0) {
              console.log(`[SPEECH] user speech recognized: "${transcript}"`);
              this._notifyTranscript({
                speaker: 'You (Incident Commander)',
                text: transcript,
                timestamp: new Date().toISOString().substring(11, 16),
              });
            }
          }
        }
      };

      this.recognition.onerror = (err) => {
        if (err.error !== 'no-speech') {
          console.warn('[SPEECH] Speech recognition note:', err.error);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if still connected
        if (this.isConnected && this.isSpeechRecognitionActive) {
          try {
            this.recognition.start();
          } catch {
            // Ignored
          }
        }
      };

      this.isSpeechRecognitionActive = true;
      this.recognition.start();
      console.log('[SPEECH] Live speech recognition activated.');
    } catch (e) {
      console.warn('[SPEECH] Could not start speech recognition:', e.message);
    }
  }

  /**
   * Stop browser speech recognition
   * @private
   */
  _stopSpeechRecognition() {
    this.isSpeechRecognitionActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition = null;
      } catch (e) {
        // Ignored
      }
    }
  }

  /**
   * Stop and release local microphone audio tracks
   * @private
   */
  _cleanupTracks() {
    if (this.localAudioTrack) {
      try {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
      } catch (e) {
        console.warn('[RTC] Note while closing local track:', e.message);
      }
      this.localAudioTrack = null;
    }
  }

  _notifySpeaking(uid, isSpeaking, level = 0) {
    for (const listener of this.volumeIndicatorListeners) {
      try {
        listener({ uid, level: level || (isSpeaking ? 50 : 0), isSpeaking });
      } catch (e) {
        console.error(e);
      }
    }
  }

  _notifyConnectionState(state) {
    for (const listener of this.connectionStateListeners) {
      try {
        listener(state);
      } catch (e) {
        console.error(e);
      }
    }
  }

  _notifyParticipants(participants) {
    for (const listener of this.participantListeners) {
      try {
        listener(participants);
      } catch (e) {
        console.error(e);
      }
    }
  }

  _notifyTranscript(transcriptData) {
    for (const listener of this.transcriptListeners) {
      try {
        listener(transcriptData);
      } catch (e) {
        console.error(e);
      }
    }
  }
}

export const agoraService = new AgoraVoiceService();
