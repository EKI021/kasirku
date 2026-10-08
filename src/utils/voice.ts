/**
 * VoiceAlertService
 * Layanan untuk membacakan notifikasi suara menggunakan Web Speech API
 */

export const VoiceAlertService = {
  speak: (text: string, rate: number = 1.0) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech Synthesis not supported');
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Coba cari suara bahasa Indonesia
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('id') ||
        v.lang.toLowerCase().includes('id-id') ||
        v.name.toLowerCase().includes('indonesia')
    );
    
    if (idVoice) {
      utterance.voice = idVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
};
