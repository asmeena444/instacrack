document.getElementById('usernameForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    if (!username) return;

    // Hide form, show animated processing steps
    document.getElementById('form-section').classList.add('hidden');
    document.getElementById('processing-section').classList.remove('hidden');

    // Start fake processing steps
    const dbScan = document.getElementById('db-scan');
    const accountVerify = document.getElementById('account-verify');
    const passwordFound = document.getElementById('password-found');

    setTimeout(() => {
        dbScan.classList.add('active');
        dbScan.innerHTML = `<span>🔍 Scanning Database for ${username}...</span>`;
        playSound('sounds/scan.mp3');
    }, 1000);

    setTimeout(() => {
        accountVerify.classList.add('active');
        accountVerify.innerHTML = `<span>🔄 Verifying Account & Credentials...</span>`;
        playSound('sounds/verify.mp3');
    }, 3000);

    setTimeout(() => {
        passwordFound.classList.add('active');
        passwordFound.innerHTML = `<span>⚡ Password Found! Redirecting...</span>`;
        playSound('sounds/success.mp3');
    }, 5000);

    setTimeout(() => {
        window.location.href = `/payment?username=${encodeURIComponent(username)}`;
    }, 6000);
});

function playSound(url) {
    const audio = new Audio(url);
    audio.play().catch(() => {});
}