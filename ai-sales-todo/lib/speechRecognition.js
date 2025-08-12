/**
 * マイクアクセス許可を要求する
 * @returns {Promise<boolean>} 許可されたかどうか
 */
export async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // ストリームを停止
    return true;
  } catch (error) {
    console.error('マイクアクセス許可エラー:', error);
    return false;
  }
}

/**
 * 音声認識とリアルタイム処理を管理するクラス
 */
export class SpeechRecognitionManager {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.onTranscription = null;
    this.recordingBuffer = [];
    this.recordingInterval = null;
    this.onErrorCallback = null; // ▼▼▼ エラーコールバックを保持するプロパティを追加 ▼▼▼
  }

  /**
   * 音声認識の初期化
   * @param {object} options - 初期化オプション（onErrorコールバックなど）
   * @returns {boolean} 初期化が成功したかどうか
   */
  initialize(options = {}) { // ▼▼▼ options引数を追加 ▼▼▼
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('音声認識がサポートされていません');
      return false;
    }

    // ▼▼▼ onErrorコールバックをプロパティに保存 ▼▼▼
    this.onErrorCallback = options.onError;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // 音声認識の設定
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ja-JP';
    this.recognition.maxAlternatives = 1;

    // イベントハンドラーの設定
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript && this.onTranscription) {
        this.onTranscription(finalTranscript);
      }
    };

    // ▼▼▼ onerrorハンドラを修正 ▼▼▼
    this.recognition.onerror = (event) => {
      console.error('音声認識エラー:', event.error);
      // コールバックが設定されていれば、それを呼び出す
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        // 継続的な録音のために再開
        try {
          this.recognition.start();
        } catch (e) {
          // onend後の再開に失敗した場合もエラーとして扱う
          console.error('認識の再開に失敗:', e);
          if (this.onErrorCallback) {
            this.onErrorCallback('ended-unexpectedly');
          }
        }
      }
    };

    return true;
  }

  /**
   * 録音開始
   * @param {Function} callback - 文字起こし結果のコールバック
   */
  startRecording(callback) {
    if (!this.recognition) {
      throw new Error('音声認識が初期化されていません');
    }

    this.onTranscription = callback;
    this.isRecording = true;
    this.recordingBuffer = [];

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('録音開始エラー:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error.name);
      }
      return false;
    }
  }

  /**
   * 録音停止
   */
  stopRecording() {
    this.isRecording = false;
    
    if (this.recognition) {
      this.recognition.stop();
    }

    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    if (this.recordingBuffer.length > 0 && this.onTranscription) {
      const combinedText = this.recordingBuffer.join(' ');
      this.onTranscription(combinedText);
      this.recordingBuffer = [];
    }
  }

  /**
   * 音声認識がサポートされているかどうかを確認
   * @returns {boolean}
   */
  static isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}