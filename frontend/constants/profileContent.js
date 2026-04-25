export const guidelinesContent = `Welcome to Health Companion — your personal caregiver support app.

Getting Started
• Create an account or sign in with your email
• Your profile is secured with Firebase Authentication
• All sessions are token-protected and auto-expire for safety

Home — Smartwatch & Stress Monitoring
• Tap "Connect" on the Home screen to link Health Connect
• Grant Heart Rate and Steps permissions when prompted
• Your latest heart rate and step count update every 30 seconds
• Tap "Check Stress Level" to get an AI-powered stress prediction
• The model needs at least 10 heart rate readings (about 2–5 minutes of watch data)
• Stress scores range from 0 (calm) to 100 (high stress)

Reminders
• Tap the + button to create medication or appointment reminders
• Set a time, optional description, and repeat schedule (daily, weekly, monthly)
• Tap the checkmark icon to mark a one-time reminder as completed
• Use Edit (pencil) or Delete (trash) icons to manage reminders
• Push notifications alert you at the scheduled time

AI Assistant
• Chat with CareCompanion, your AI wellness companion
• Ask about stress management, self-care, nutrition, sleep, or daily routines
• Conversations are private and not shared with third parties
• Note: AI responses are informational only — always consult your doctor for medical advice

Health Tips
• Personalized wellness tips appear on the Home screen
• Tips cover categories like self-care, stress management, exercise, and nutrition
• Refresh the Home screen to load new tips

Tips for Best Experience
• Keep your smartwatch worn and syncing for accurate health data
• Enable notifications so you never miss a reminder
• Use the pull-to-refresh gesture to update data on any screen`;

export const privacyContent = `Privacy & Security Policy
Last Updated: April 2026

This policy describes how Health Companion collects, uses, and protects your data.

What We Collect
• Account information (email, username) via Firebase Authentication
• Reminders you create (title, description, schedule)
• Chat conversations with the AI assistant (stored in-memory, not persisted)
• Health data from Health Connect (heart rate, step count) — read-only
• Stress prediction results and aggregated health statistics

How Your Data Is Used
• Account data: to authenticate you and personalize your experience
• Reminders: stored in our database so they sync across sessions
• Health metrics: aggregated averages (stress score, heart rate, steps) are stored to provide personalized insights, trends, and AI recommendations
• Chat history: maintained only during your active session for conversational context, cleared when the service restarts

Data Storage & Security
• Authentication is handled by Google Firebase with industry-standard encryption
• All API communication uses token-based authorization (Firebase ID tokens)
• Backend services run in isolated Docker containers
• Raw health sensor data is processed in real-time and not stored — only computed averages and stress scores are saved

Data Sharing
• We do not sell, rent, or share your personal data with third parties
• Health data is processed only by our own prediction service and is never forwarded elsewhere
• No advertising or tracking SDKs are used in this app

Your Rights
• Access: View your reminders, health statistics, and profile information at any time within the app
• Deletion: Delete your account and all associated data through the app
• Revoke: Remove Health Connect permissions at any time through Android Settings

Health Disclaimer
• This app is not a medical device and does not provide medical diagnoses
• Stress predictions are informational estimates, not clinical assessments
• Always consult a qualified healthcare professional for medical concerns
• In a crisis, contact the 988 Suicide & Crisis Lifeline (call/text 988) or Crisis Text Line (text HOME to 741741)

Contact
For privacy questions, reach out to us at support@healthcompanion.app`;
