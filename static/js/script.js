
// ======================================
// 1. PASSWORD VISIBILITY TOGGLE
// ======================================

const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "Hide";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
    }

});


// ======================================
// 2. PASSWORD STRENGTH CHECKER
// ======================================

passwordInput.addEventListener("input", checkPassword);

async function checkPassword() {

    const password = passwordInput.value;

    const strengthText = document.getElementById("strengthText");
    const strengthBar = document.getElementById("strengthBar");
    const suggestions = document.getElementById("suggestions");

    if (!password) {
        strengthText.textContent = "Not Checked";
        strengthBar.style.width = "0%";
        suggestions.textContent = "Enter a password to begin checking.";
        return;
    }

    try {

        const response = await fetch("/api/check-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password: password })
        });

        if (!response.ok) {
            throw new Error("Backend connection failed");
        }

        const result = await response.json();

        // Display strength
        strengthText.textContent = result.strength;

        let percentage = 20;
        let color = "#ef4444";

        if (result.strength === "Medium") {
            percentage = 65;
            color = "#f59e0b";
        }

        if (result.strength === "Strong") {
            percentage = 100;
            color = "#22c55e";
        }

        strengthText.style.color = color;
        strengthBar.style.width = percentage + "%";
        strengthBar.style.background = color;

        // Display requirements
        if (result.checks) {

            const names = {
                length: "At least 8 characters",
                uppercase: "Uppercase letter (A-Z)",
                lowercase: "Lowercase letter (a-z)",
                number: "Number (0-9)",
                special: "Special character (@#$!)"
            };

            Object.entries(result.checks).forEach(([key, passed]) => {

                const element = document.getElementById(key);

                if (element) {
                    element.textContent =
                        (passed ? "✓ " : "○ ") + names[key];

                    element.style.color =
                        passed ? "#4ade80" : "#aab5ca";
                }

            });
        }

        // Display suggestions
        suggestions.textContent = result.suggestions.join(" ");

        if (result.common_password) {
            suggestions.textContent +=
                " WARNING: Common password detected.";
        }

        if (result.repeated_pattern) {
            suggestions.textContent +=
                " Repeated characters detected.";
        }

        if (result.sequential_pattern) {
            suggestions.textContent +=
                " Sequential pattern detected.";
        }

    } catch (error) {

        strengthText.textContent = "Error";
        suggestions.textContent =
            "Unable to connect to Python backend.";

        console.error(error);
    }
}


// ======================================
// 3. PASSWORD LENGTH CONTROL
// ======================================

const lengthSlider = document.getElementById("passwordLength");
const lengthValue = document.getElementById("lengthValue");

lengthSlider.addEventListener("input", function () {
    lengthValue.textContent = lengthSlider.value;
});


// ======================================
// 4. SECURE PASSWORD GENERATOR
// ======================================

const generateBtn = document.getElementById("generateBtn");

generateBtn.addEventListener("click", generatePassword);

function generatePassword() {

    const length = Number(lengthSlider.value);

    const upper = document.getElementById("upper").checked;
    const lower = document.getElementById("lower").checked;
    const digits = document.getElementById("digits").checked;
    const symbols = document.getElementById("symbols").checked;

    const groups = [];

    if (upper) groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    if (lower) groups.push("abcdefghijklmnopqrstuvwxyz");
    if (digits) groups.push("0123456789");
    if (symbols) groups.push("!@#$%^&*()_+-=");

    const output = document.getElementById("generatedPassword");

    if (groups.length === 0) {
        output.value = "";
        alert("Please select at least one character type.");
        return;
    }

    if (length < groups.length) {
        output.value = "";
        alert("Increase password length.");
        return;
    }

    function secureIndex(max) {

        const random = new Uint32Array(1);
        const limit = Math.floor(4294967296 / max) * max;

        do {
            crypto.getRandomValues(random);
        } while (random[0] >= limit);

        return random[0] % max;
    }

    function randomCharacter(characters) {
        return characters[secureIndex(characters.length)];
    }

    const characters = groups.join("");

    let password = groups.map(randomCharacter);

    while (password.length < length) {
        password.push(randomCharacter(characters));
    }

    for (let i = password.length - 1; i > 0; i--) {

        const j = secureIndex(i + 1);

        [password[i], password[j]] =
        [password[j], password[i]];
    }

    output.value = password.join("");

    document.getElementById("copyMessage").textContent = "";
}


// ======================================
// 5. COPY GENERATED PASSWORD
// ======================================

const copyBtn = document.getElementById("copyBtn");

copyBtn.addEventListener("click", async function () {

    const output = document.getElementById("generatedPassword");

    if (!output.value) {
        alert("Please generate a password first.");
        return;
    }

    try {

        await navigator.clipboard.writeText(output.value);

        document.getElementById("copyMessage").textContent =
            "Password copied successfully!";

    } catch (error) {

        document.getElementById("copyMessage").textContent =
            "Clipboard access unavailable. Copy manually.";
    }

});
