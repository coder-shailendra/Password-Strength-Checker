
from flask import Flask, render_template, request, jsonify
import re

app = Flask(__name__)

# Common passwords list
COMMON_PASSWORDS = {
    "123456",
    "12345678",
    "password",
    "password123",
    "qwerty",
    "admin",
    "111111",
    "abc123",
    "iloveyou"
}


# Password Analysis Function
def analyze_password(password):

    if not password:
        return {
            "strength": "Not Checked",
            "score": 0,
            "suggestions": ["Please enter a password."]
        }

    suggestions = []
    score = 0

    # Check password requirements
    checks = {
        "length": len(password) >= 8,
        "uppercase": bool(re.search(r"[A-Z]", password)),
        "lowercase": bool(re.search(r"[a-z]", password)),
        "number": bool(re.search(r"[0-9]", password)),
        "special": bool(re.search(r"[^A-Za-z0-9]", password))
    }

    # Length scoring
    if len(password) >= 16:
        score += 2
    elif len(password) >= 12:
        score += 1
    else:
        suggestions.append("Use at least 12-16 characters.")

    # Character variety scoring
    score += sum(checks.values())

    if not checks["uppercase"]:
        suggestions.append("Add uppercase letters.")

    if not checks["lowercase"]:
        suggestions.append("Add lowercase letters.")

    if not checks["number"]:
        suggestions.append("Add numbers.")

    if not checks["special"]:
        suggestions.append("Add special characters.")

    # Common password detection
    common = password.lower() in COMMON_PASSWORDS

    if common:
        score = 0
        suggestions.append("This is a commonly used password. Choose a unique one.")

    # Repeated character detection
    repeated = bool(re.search(r"(.)\1{3,}", password))

    if repeated:
        score -= 2
        suggestions.append("Avoid repeating the same character many times.")

    # Sequential pattern detection
    sequences = [
        "0123456789",
        "abcdefghijklmnopqrstuvwxyz",
        "qwertyuiop",
        "asdfghjkl",
        "zxcvbnm"
    ]

    sequential = any(
        any(
            password.lower()[i:i+4] in sequence
            or password.lower()[i:i+4][::-1] in sequence
            for i in range(len(password) - 3)
        )
        for sequence in sequences
    )

    if sequential:
        score -= 2
        suggestions.append("Avoid predictable sequential patterns.")

    score = max(0, min(score, 7))

    # Final strength assessment
    if common:
        strength = "Weak"

    elif score >= 5 and len(password) >= 12 and not repeated and not sequential:
        strength = "Strong"

    elif score >= 3 and len(password) >= 8:
        strength = "Medium"

    else:
        strength = "Weak"

    if not suggestions:
        suggestions.append("Good! No basic security issues detected.")

    return {
        "strength": strength,
        "score": score,
        "checks": checks,
        "common_password": common,
        "repeated_pattern": repeated,
        "sequential_pattern": sequential,
        "suggestions": suggestions
    }


# Home Page
@app.route("/")
def home():
    return render_template("index.html")


# Password Analysis API
@app.route("/api/check-password", methods=["POST"])
def check_password():

    data = request.get_json(silent=True) or {}

    password = data.get("password", "")

    if not isinstance(password, str):
        return jsonify({"error": "Invalid password input."}), 400

    if len(password) > 256:
        return jsonify({"error": "Password is too long."}), 400

    result = analyze_password(password)

    return jsonify(result)


# Run Application
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
