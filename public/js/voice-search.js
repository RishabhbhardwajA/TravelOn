// Voice Search Logic using Web Speech API

document.addEventListener('DOMContentLoaded', () => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log("Web Speech API not supported");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false; // Stop after one sentence
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    // Desktop Elements
    const desktopVoiceBtn = document.getElementById('desktopVoiceBtn');
    const desktopSearchInput = document.getElementById('desktopSearchInput');

    // Mobile Elements (If added later, logic remains same)
    // const mobileVoiceBtn = ...

    function startListening(btn, input) {
        if (!btn || !input) return;

        recognition.start();
        btn.classList.add('listening');
        const icon = btn.querySelector('i');
        icon.classList.remove('fa-microphone');
        icon.classList.add('fa-microphone-lines', 'fa-beat-fade'); // Visual feedback
    }

    function stopListeningUI(btn) {
        if (!btn) return;
        btn.classList.remove('listening');
        const icon = btn.querySelector('i');
        icon.classList.remove('fa-microphone-lines', 'fa-beat-fade');
        icon.classList.add('fa-microphone');
    }

    // Event Listeners
    if (desktopVoiceBtn) {
        desktopVoiceBtn.addEventListener('click', () => {
            startListening(desktopVoiceBtn, desktopSearchInput);
        });
    }

    // Recognition Events
    recognition.onresult = (event) => {
        let transcript = event.results[0][0].transcript;
        console.log("Raw Voice Input:", transcript);

        // Remove trailing punctuation (periods, commas, etc.)
        transcript = transcript.replace(/[.,!?]+$/, "").trim();
        console.log("Processed Voice Input:", transcript);

        // Update appropriate input and submit
        if (desktopSearchInput) {
            desktopSearchInput.value = transcript;
            desktopSearchInput.form.submit();
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (desktopVoiceBtn) stopListeningUI(desktopVoiceBtn);
    };

    recognition.onend = () => {
        if (desktopVoiceBtn) stopListeningUI(desktopVoiceBtn);
    };
});
