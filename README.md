# StudyBuddy 📚

> AI-powered study notes and interactive flashcards directly in your browser sidebar — powered by the blazing-fast Groq API.

StudyBuddy is a Chrome extension designed to help students and lifelong learners grasp new concepts quickly. Whether you need a detailed deep-dive into a historical event or a quick deck of flashcards to memorize chemical formulas, StudyBuddy generates high-quality study materials in seconds without making you leave your current tab.

## ✨ Features

* **Seamless Side Panel UI:** Opens alongside your active browser tabs so you can research and study simultaneously.
* **📝 AI Study Notes:**
    * Generate custom notes formatted in clean Markdown.
    * Choose your detail level: *Brief overview*, *Standard*, or *Deep dive*.
    * Includes Key Concepts, Detailed Explanations, Key Takeaways, and a Quick Quiz.
    * One-click "Copy" button to easily export your notes.
* **🃏 Interactive Flashcards:**
    * Generate decks of 5, 10, 15, or 20 flashcards on any topic.
    * Interactive flip animations and progress tracking.
    * Self-grade as you go ("✅ Got it!" or "❌ Still learning").
    * End-of-deck summary with score and the ability to restart or retry.
* **⚡ Powered by Groq:**
    * Bring Your Own Key (BYOK) for free, ultra-fast generation.
    * Choose between top-tier models: **Llama 3.3 70B** (best quality), **Llama 3.1 8B** (fastest), or **Mixtral 8x7B**.
* **Sleek Dark Mode:** A beautiful, easy-on-the-eyes interface built with modern typography (`Syne` and `DM Sans`).

## 🚀 Installation (Unpacked Extension)

Since this extension is in active development, you can install it locally on your Chrome browser:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked** in the top left corner.
5. Select the folder containing the extension files.
6. Pin the extension to your toolbar for easy access!

## ⚙️ Setup & Usage

1. **Get a free API Key:** Head over to [Groq Console](https://console.groq.com) and create a free API key.
2. **Configure the Extension:** Open StudyBuddy by clicking the extension icon. Click the ⚙️ (Settings) icon in the top right, paste your Groq API key, select your preferred model, and click **Save**.
3. **Start Studying:** * Navigate to the **Study Notes** tab, type in a topic, select your depth, and click "Generate".
   * Navigate to the **Flashcards** tab, type a subject, select the number of cards, and start flipping!

## 🛠️ Built With

* **HTML/CSS/JS:** Pure vanilla web technologies (No heavy frameworks).
* **Chrome Extension API:** Manifest V3, Side Panel API, Storage API.
* **Groq API:** OpenAI-compatible endpoint for lightning-fast LLM inference.
